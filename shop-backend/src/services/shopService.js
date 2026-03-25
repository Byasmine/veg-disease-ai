const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db/pool');

function mapProductRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    stock: row.stock,
    currency: row.currency || 'USD',
    imageUrl: row.image_url || undefined,
  };
}

function mapCategoryRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
  };
}

async function getCategories() {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, name, description FROM categories ORDER BY sort_order ASC, name ASC`
  );
  return rows.map(mapCategoryRow);
}

async function getProducts({ categoryId, q } = {}) {
  const pool = getPool();
  let sql = `SELECT id, category_id, name, description, price, stock, currency, image_url FROM products WHERE 1=1`;
  const params = [];
  if (categoryId) {
    params.push(categoryId);
    sql += ` AND category_id = $${params.length}`;
  }
  if (q) {
    params.push(`%${String(q).toLowerCase()}%`);
    sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(COALESCE(description,'')) LIKE $${params.length})`;
  }
  sql += ` ORDER BY name ASC`;
  const { rows } = await pool.query(sql, params);
  return rows.map(mapProductRow);
}

async function getProductById(productId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, category_id, name, description, price, stock, currency, image_url FROM products WHERE id = $1`,
    [productId]
  );
  return mapProductRow(rows[0]) || null;
}

async function getCart(userId) {
  const pool = getPool();
  const { rows: items } = await pool.query(
    `SELECT ci.id, ci.product_id, ci.quantity, ci.unit_price,
            p.id as p_id, p.category_id, p.name, p.description, p.price, p.stock, p.currency, p.image_url
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1`,
    [userId]
  );

  const expandedItems = items.map((row) => {
    const product = mapProductRow({
      id: row.p_id,
      category_id: row.category_id,
      name: row.name,
      description: row.description,
      price: row.price,
      stock: row.stock,
      currency: row.currency,
      image_url: row.image_url,
    });
    const quantity = row.quantity;
    const unitPrice = Number(row.unit_price);
    const lineTotal = +(quantity * unitPrice).toFixed(2);
    return {
      id: row.id,
      productId: row.product_id,
      quantity,
      unitPrice,
      lineTotal,
      product,
    };
  });

  const total = expandedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    userId,
    items: expandedItems,
    total: +total.toFixed(2),
    currency: 'USD',
  };
}

async function addCartItem(userId, productId, quantity = 1) {
  const qty = Math.max(1, Number(quantity) || 1);
  const product = await getProductById(productId);
  if (!product) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }

  const pool = getPool();
  const { rows: existing } = await pool.query(
    `SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );

  if (existing[0]) {
    const newQty = existing[0].quantity + qty;
    await pool.query(`UPDATE cart_items SET quantity = $1, unit_price = $2 WHERE id = $3`, [
      newQty,
      product.price,
      existing[0].id,
    ]);
  } else {
    await pool.query(
      `INSERT INTO cart_items (id, user_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), userId, productId, qty, product.price]
    );
  }

  return getCart(userId);
}

async function updateCartItem(userId, itemId, quantity) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 0) {
    const err = new Error('Quantity must be a number >= 0');
    err.status = 400;
    throw err;
  }

  const pool = getPool();
  const { rows } = await pool.query(`SELECT id FROM cart_items WHERE id = $1 AND user_id = $2`, [
    itemId,
    userId,
  ]);
  if (!rows[0]) {
    const err = new Error('Cart item not found');
    err.status = 404;
    throw err;
  }

  if (qty === 0) {
    await pool.query(`DELETE FROM cart_items WHERE id = $1`, [itemId]);
  } else {
    await pool.query(`UPDATE cart_items SET quantity = $1 WHERE id = $2`, [qty, itemId]);
  }

  return getCart(userId);
}

async function removeCartItem(userId, itemId) {
  const pool = getPool();
  await pool.query(`DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, [itemId, userId]);
  return getCart(userId);
}

async function clearCart(userId) {
  const pool = getPool();
  await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
  return getCart(userId);
}

async function checkout(userId, paymentMethod = 'simulated-card', shipping = {}) {
  const cart = await getCart(userId);
  if (!cart.items.length) {
    const err = new Error('Cart is empty');
    err.status = 400;
    throw err;
  }

  const pool = getPool();
  const orderId = uuidv4();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: urows } = await client.query(
      `SELECT full_name, phone, address_line1, address_line2, city, postal_code, country FROM users WHERE id = $1`,
      [userId]
    );
    const u = urows[0] || {};

    const shipName = shipping.shippingName ?? shipping.fullName ?? u.full_name ?? '';
    const shipPhone = shipping.shippingPhone ?? shipping.phone ?? u.phone ?? '';
    const line1 = shipping.shippingLine1 ?? shipping.line1 ?? u.address_line1 ?? '';
    const line2 = shipping.shippingLine2 ?? shipping.line2 ?? u.address_line2 ?? '';
    const city = shipping.shippingCity ?? shipping.city ?? u.city ?? '';
    const postal = shipping.shippingPostalCode ?? shipping.postalCode ?? u.postal_code ?? '';
    const country = shipping.shippingCountry ?? shipping.country ?? u.country ?? 'US';

    if (!String(line1).trim() || !String(shipName).trim() || !String(shipPhone).trim()) {
      const err = new Error('Shipping name, phone, and address line are required for orders');
      err.status = 400;
      throw err;
    }

    await client.query(
      `INSERT INTO orders (id, user_id, status, payment_method, total, currency,
        shipping_name, shipping_phone, shipping_line1, shipping_line2, shipping_city, shipping_postal_code, shipping_country)
       VALUES ($1, $2, 'paid', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        orderId,
        userId,
        paymentMethod,
        cart.total,
        cart.currency,
        shipName,
        shipPhone,
        line1,
        line2 || null,
        city,
        postal,
        country,
      ]
    );

    for (const i of cart.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, i.productId, i.product.name, i.quantity, i.unitPrice, i.lineTotal]
      );
    }

    await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return getOrderById(userId, orderId);
}

async function getOrders(userId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, user_id, status, payment_method, total, currency, created_at,
            shipping_name, shipping_phone, shipping_line1, shipping_line2, shipping_city, shipping_postal_code, shipping_country
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  const orders = [];
  for (const row of rows) {
    const { rows: items } = await pool.query(
      `SELECT product_id, product_name, quantity, unit_price, line_total FROM order_items WHERE order_id = $1`,
      [row.id]
    );
    orders.push({
      id: row.id,
      userId: row.user_id,
      status: row.status,
      paymentMethod: row.payment_method,
      total: Number(row.total),
      currency: row.currency,
      createdAt: row.created_at.toISOString(),
      shipping: {
        name: row.shipping_name,
        phone: row.shipping_phone,
        line1: row.shipping_line1,
        line2: row.shipping_line2,
        city: row.shipping_city,
        postalCode: row.shipping_postal_code,
        country: row.shipping_country,
      },
      items: items.map((it) => ({
        productId: it.product_id,
        productName: it.product_name,
        quantity: it.quantity,
        unitPrice: Number(it.unit_price),
        lineTotal: Number(it.line_total),
      })),
    });
  }
  return orders;
}

async function getOrderById(userId, orderId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, user_id, status, payment_method, total, currency, created_at,
            shipping_name, shipping_phone, shipping_line1, shipping_line2, shipping_city, shipping_postal_code, shipping_country
     FROM orders WHERE id = $1 AND user_id = $2`,
    [orderId, userId]
  );
  const row = rows[0];
  if (!row) return null;
  const { rows: items } = await pool.query(
    `SELECT product_id, product_name, quantity, unit_price, line_total FROM order_items WHERE order_id = $1`,
    [orderId]
  );
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    paymentMethod: row.payment_method,
    total: Number(row.total),
    currency: row.currency,
    createdAt: row.created_at.toISOString(),
    shipping: {
      name: row.shipping_name,
      phone: row.shipping_phone,
      line1: row.shipping_line1,
      line2: row.shipping_line2,
      city: row.shipping_city,
      postalCode: row.shipping_postal_code,
      country: row.shipping_country,
    },
    items: items.map((it) => ({
      productId: it.product_id,
      productName: it.product_name,
      quantity: it.quantity,
      unitPrice: Number(it.unit_price),
      lineTotal: Number(it.line_total),
    })),
  };
}

module.exports = {
  getCategories,
  getProducts,
  getProductById,
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkout,
  getOrders,
  getOrderById,
};

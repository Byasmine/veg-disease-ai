const { v4: uuidv4 } = require('uuid');
const { readJson, writeJson } = require('../utils/storage');

const FILES = {
  categories: 'categories.json',
  products: 'products.json',
  carts: 'carts.json',
  orders: 'orders.json',
};

async function getCategories() {
  return readJson(FILES.categories, []);
}

async function getProducts({ categoryId, q } = {}) {
  const products = await readJson(FILES.products, []);
  return products.filter((p) => {
    const byCategory = categoryId ? p.categoryId === categoryId : true;
    const byQuery = q
      ? `${p.name} ${p.description}`.toLowerCase().includes(String(q).toLowerCase())
      : true;
    return byCategory && byQuery;
  });
}

async function getProductById(productId) {
  const products = await readJson(FILES.products, []);
  return products.find((p) => p.id === productId) || null;
}

async function getCart(userId) {
  const carts = await readJson(FILES.carts, {});
  const items = carts[userId] || [];
  const products = await readJson(FILES.products, []);

  const expandedItems = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: +(item.quantity * item.unitPrice).toFixed(2),
        product,
      };
    })
    .filter(Boolean);

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

  const carts = await readJson(FILES.carts, {});
  const userItems = carts[userId] || [];

  const existing = userItems.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    userItems.push({
      id: uuidv4(),
      productId,
      quantity: qty,
      unitPrice: product.price,
    });
  }

  carts[userId] = userItems;
  await writeJson(FILES.carts, carts);
  return getCart(userId);
}

async function updateCartItem(userId, itemId, quantity) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 0) {
    const err = new Error('Quantity must be a number >= 0');
    err.status = 400;
    throw err;
  }

  const carts = await readJson(FILES.carts, {});
  const userItems = carts[userId] || [];
  const idx = userItems.findIndex((i) => i.id === itemId);

  if (idx === -1) {
    const err = new Error('Cart item not found');
    err.status = 404;
    throw err;
  }

  if (qty === 0) {
    userItems.splice(idx, 1);
  } else {
    userItems[idx].quantity = qty;
  }

  carts[userId] = userItems;
  await writeJson(FILES.carts, carts);
  return getCart(userId);
}

async function removeCartItem(userId, itemId) {
  const carts = await readJson(FILES.carts, {});
  const userItems = carts[userId] || [];
  carts[userId] = userItems.filter((i) => i.id !== itemId);
  await writeJson(FILES.carts, carts);
  return getCart(userId);
}

async function clearCart(userId) {
  const carts = await readJson(FILES.carts, {});
  carts[userId] = [];
  await writeJson(FILES.carts, carts);
  return getCart(userId);
}

async function checkout(userId, paymentMethod = 'simulated-card') {
  const cart = await getCart(userId);
  if (!cart.items.length) {
    const err = new Error('Cart is empty');
    err.status = 400;
    throw err;
  }

  const orders = await readJson(FILES.orders, []);
  const order = {
    id: uuidv4(),
    userId,
    status: 'paid',
    paymentMethod,
    items: cart.items.map((i) => ({
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    total: cart.total,
    currency: cart.currency,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(order);
  await writeJson(FILES.orders, orders);
  await clearCart(userId);
  return order;
}

async function getOrders(userId) {
  const orders = await readJson(FILES.orders, []);
  return orders.filter((o) => o.userId === userId);
}

async function getOrderById(userId, orderId) {
  const orders = await getOrders(userId);
  return orders.find((o) => o.id === orderId) || null;
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

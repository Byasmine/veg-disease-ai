const fs = require('fs/promises');
const path = require('path');
const { getPool } = require('./pool');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

async function migrate() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const userCols = [
      ['full_name', 'VARCHAR(255)'],
      ['phone', 'VARCHAR(64)'],
      ['avatar_url', 'TEXT'],
      ['email_verified', 'BOOLEAN NOT NULL DEFAULT TRUE'],
      ['address_line1', 'VARCHAR(255)'],
      ['address_line2', 'VARCHAR(255)'],
      ['city', 'VARCHAR(128)'],
      ['postal_code', 'VARCHAR(32)'],
      ['country', "VARCHAR(64) DEFAULT 'US'"],
    ];
    for (const [col, def] of userCols) {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} ${def}`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_challenges (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        purpose VARCHAR(32) NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_challenges (email, purpose);`
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sort_order INT NOT NULL DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        currency VARCHAR(8) NOT NULL DEFAULT 'USD',
        image_url TEXT
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL CHECK (quantity >= 1),
        unit_price NUMERIC(12, 2) NOT NULL,
        UNIQUE (user_id, product_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(32) NOT NULL DEFAULT 'paid',
        payment_method VARCHAR(64),
        total NUMERIC(12, 2) NOT NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'USD',
        shipping_name VARCHAR(255),
        shipping_phone VARCHAR(64),
        shipping_line1 VARCHAR(255),
        shipping_line2 VARCHAR(255),
        shipping_city VARCHAR(128),
        shipping_postal_code VARCHAR(32),
        shipping_country VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(64) NOT NULL,
        product_name TEXT,
        quantity INT NOT NULL CHECK (quantity >= 1),
        unit_price NUMERIC(12, 2) NOT NULL,
        line_total NUMERIC(12, 2) NOT NULL
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);`);

    await seedCatalog(client);
  } finally {
    client.release();
  }
}

async function seedCatalog(client) {
  try {
    if (process.env.CATALOG_RESET === 'true') {
      await client.query('DELETE FROM cart_items');
      await client.query('DELETE FROM products');
      await client.query('DELETE FROM categories');
      console.warn('[migrate] CATALOG_RESET=true — cleared categories, products, and cart lines.');
    }

    const catRaw = await fs.readFile(path.join(DATA_DIR, 'categories.json'), 'utf8');
    const categories = JSON.parse(catRaw);
    let order = 0;
    for (const c of categories) {
      await client.query(
        `INSERT INTO categories (id, name, description, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           sort_order = EXCLUDED.sort_order`,
        [c.id, c.name, c.description || '', order++]
      );
    }

    const prodRaw = await fs.readFile(path.join(DATA_DIR, 'products.json'), 'utf8');
    const products = JSON.parse(prodRaw);
    for (const p of products) {
      await client.query(
        `INSERT INTO products (id, category_id, name, description, price, stock, currency, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           category_id = EXCLUDED.category_id,
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price = EXCLUDED.price,
           stock = EXCLUDED.stock,
           currency = EXCLUDED.currency,
           image_url = EXCLUDED.image_url`,
        [
          p.id,
          p.categoryId,
          p.name,
          p.description || '',
          p.price,
          p.stock ?? 0,
          p.currency || 'USD',
          p.imageUrl || null,
        ]
      );
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.warn('[migrate] No data/*.json seed files found, skipping catalog seed.');
    } else {
      throw e;
    }
  }
}

module.exports = { migrate };

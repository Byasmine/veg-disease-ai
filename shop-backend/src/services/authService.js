const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db/pool');

const SALT_ROUNDS = 10;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || String(s).length < 16) {
    throw new Error('JWT_SECRET must be set to a random string of at least 16 characters.');
  }
  return s;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), { expiresIn: JWT_EXPIRES });
}

function mapPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || '',
    phone: row.phone || '',
    avatarUrl: row.avatar_url || null,
    emailVerified: row.email_verified !== false,
    addressLine1: row.address_line1 || '',
    addressLine2: row.address_line2 || '',
    city: row.city || '',
    postalCode: row.postal_code || '',
    country: row.country || 'US',
  };
}

async function fetchUserById(id) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, email, full_name, phone, avatar_url, email_verified,
            address_line1, address_line2, city, postal_code, country
     FROM users WHERE id = $1`,
    [id]
  );
  return mapPublicUser(rows[0]);
}

/** Create account and sign in immediately (no email / OTP). */
async function registerPendingProfile(body) {
  const email = String(body?.email || '')
    .trim()
    .toLowerCase();
  const password = body?.password;
  const fullName = String(body?.fullName || body?.full_name || '').trim();
  const phone = String(body?.phone || '').trim();
  const addressLine1 = String(body?.addressLine1 || body?.address_line1 || '').trim();
  const addressLine2 = String(body?.addressLine2 || body?.address_line2 || '').trim();
  const city = String(body?.city || '').trim();
  const postalCode = String(body?.postalCode || body?.postal_code || '').trim();
  const country = String(body?.country || 'US').trim() || 'US';

  if (!email || !email.includes('@')) {
    const err = new Error('Valid email is required');
    err.status = 400;
    throw err;
  }
  if (!password || String(password).length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    throw err;
  }
  if (!fullName) {
    const err = new Error('Full name is required');
    err.status = 400;
    throw err;
  }
  if (!phone) {
    const err = new Error('Phone is required');
    err.status = 400;
    throw err;
  }
  if (!addressLine1) {
    const err = new Error('Address line 1 is required');
    err.status = 400;
    throw err;
  }
  if (!city || !postalCode) {
    const err = new Error('City and postal code are required');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
  const id = uuidv4();
  const pool = getPool();

  try {
    await pool.query(
      `INSERT INTO users (
        id, email, password_hash, email_verified,
        full_name, phone, address_line1, address_line2, city, postal_code, country
      ) VALUES ($1, $2, $3, TRUE, $4, $5, $6, $7, $8, $9, $10)`,
      [id, email, passwordHash, fullName, phone, addressLine1, addressLine2 || null, city, postalCode, country]
    );
  } catch (e) {
    if (e.code === '23505') {
      const err = new Error('An account with this email already exists');
      err.status = 409;
      throw err;
    }
    throw e;
  }

  const user = await fetchUserById(id);
  return { user, token: signToken({ id: user.id, email: user.email }) };
}

async function verifyLogin(email, password) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, email, password_hash FROM users WHERE email = $1`,
    [normalized]
  );
  const row = rows[0];
  if (!row) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(String(password), row.password_hash);
  if (!ok) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const user = await fetchUserById(row.id);
  return { user, token: signToken({ id: user.id, email: user.email }) };
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!newPassword || String(newPassword).length < 6) {
    const err = new Error('New password must be at least 6 characters');
    err.status = 400;
    throw err;
  }
  const pool = getPool();
  const { rows } = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
  if (!rows[0]) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const match = await bcrypt.compare(String(currentPassword), rows[0].password_hash);
  if (!match) {
    const err = new Error('Current password is incorrect');
    err.status = 401;
    throw err;
  }
  const hash = await bcrypt.hash(String(newPassword), SALT_ROUNDS);
  await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, userId]);
  return { message: 'Password changed.' };
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

module.exports = {
  registerPendingProfile,
  verifyLogin,
  changePassword,
  verifyToken,
  signToken,
  fetchUserById,
  mapPublicUser,
};

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getPool } = require('../db/pool');

const OTP_EXPIRES_MS = 15 * 60 * 1000;
const PURPOSE_SIGNUP = 'signup';
const PURPOSE_PASSWORD_RESET = 'password_reset';

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function createOtp(email, purpose) {
  const normalized = String(email || '').trim().toLowerCase();
  const pool = getPool();
  const code = generateOtp();
  const hash = await bcrypt.hash(code, 8);
  const expires = new Date(Date.now() + OTP_EXPIRES_MS);
  await pool.query(`DELETE FROM otp_challenges WHERE email = $1 AND purpose = $2`, [normalized, purpose]);
  await pool.query(
    `INSERT INTO otp_challenges (email, purpose, code_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [normalized, purpose, hash, expires]
  );
  return code;
}

async function verifyOtp(email, purpose, code) {
  const normalized = String(email || '').trim().toLowerCase();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, code_hash, expires_at FROM otp_challenges
     WHERE email = $1 AND purpose = $2 ORDER BY id DESC LIMIT 1`,
    [normalized, purpose]
  );
  const row = rows[0];
  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) {
    await pool.query(`DELETE FROM otp_challenges WHERE id = $1`, [row.id]);
    return false;
  }
  const ok = await bcrypt.compare(String(code).trim(), row.code_hash);
  if (ok) {
    await pool.query(`DELETE FROM otp_challenges WHERE email = $1 AND purpose = $2`, [normalized, purpose]);
  }
  return ok;
}

module.exports = {
  createOtp,
  verifyOtp,
  PURPOSE_SIGNUP,
  PURPOSE_PASSWORD_RESET,
};

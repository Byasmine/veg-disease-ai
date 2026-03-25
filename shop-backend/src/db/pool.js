const { Pool } = require('pg');

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required (PostgreSQL connection string).');
  }
  const isLocal =
    /localhost|127\.0\.0\.1/.test(connectionString) && !process.env.FORCE_DB_SSL;
  const ssl =
    process.env.DATABASE_SSL === 'false' || isLocal
      ? false
      : {
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
        };
  return new Pool({
    connectionString,
    ssl,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

let poolSingleton;
function getPool() {
  if (!poolSingleton) {
    poolSingleton = createPool();
  }
  return poolSingleton;
}

module.exports = { getPool };

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { migrate } = require('./db/migrate');
const shopRoutes = require('./routes/shopRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = Number(process.env.PORT || 8082);

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

const uploadsRoot = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsRoot));

app.get('/', (_req, res) => {
  res.json({
    name: 'shop-backend',
    status: 'ok',
    docs: {
      health: '/api/shop/health',
      auth: '/api/auth (register, verify-signup, login, forgot-password, reset-password, …)',
      user: '/api/user (profile, avatar)',
      categories: '/api/shop/categories',
      products: '/api/shop/products',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/shop', shopRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
  const message =
    err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 2MB)' : err.message || 'Internal server error';
  res.status(status).json({
    status: 'error',
    message,
  });
});

async function start() {
  await migrate();
  if (require.main === module) {
    const host = process.env.HOST || '0.0.0.0';
    app.listen(PORT, host, () => {
      console.log(`shop-backend listening on port ${PORT} (bind ${host}; emulator use http://10.0.2.2:${PORT})`);
    });
  }
}

start().catch((err) => {
  console.error('Failed to start shop-backend:', err.message);
  process.exit(1);
});

module.exports = app;

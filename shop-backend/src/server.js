require('dotenv').config();
const express = require('express');
const cors = require('cors');

const shopRoutes = require('./routes/shopRoutes');

const app = express();
const PORT = Number(process.env.PORT || 8082);

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.json({
    name: 'shop-backend',
    status: 'ok',
    docs: {
      health: '/api/shop/health',
      categories: '/api/shop/categories',
      products: '/api/shop/products',
    },
  });
});

app.use('/api/shop', shopRoutes);

// Centralized error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`shop-backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;

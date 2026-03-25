require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { migrate } = require('./db/migrate');
const shopRoutes = require('./routes/shopRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { sendEmail, isEmailApiConfigured } = require('./services/emailService');

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
      auth: '/api/auth (register, login, change-password, me)',
      user: '/api/user (profile, avatar)',
      categories: '/api/shop/categories',
      products: '/api/shop/products',
    },
  });
});

// Simple integration test for Railway email delivery (disabled by default).
// Enable with: ALLOW_EMAIL_TEST=true in Railway env vars.
app.post('/test-email', async (req, res) => {
  try {
    if (process.env.ALLOW_EMAIL_TEST !== 'true') {
      return res.status(404).json({ ok: false, message: 'test endpoint disabled' });
    }

    if (!isEmailApiConfigured()) {
      return res.status(500).json({ ok: false, message: 'email_api_not_configured' });
    }

    const { to, subject, html, text } = req.body || {};
    if (!to) return res.status(400).json({ ok: false, message: 'Missing `to` in body' });

    const testSubject = subject || 'Leaf Doctor test email';
    const testHtml = html || '<p>Test email from Leaf Doctor</p>';

    const response = await sendEmail(to, testSubject, testHtml, text);
    const id = response?.id ?? response?.messageId ?? null;
    return res.json({ ok: true, id });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e?.message || String(e) });
  }
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

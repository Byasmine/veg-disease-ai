// Load .env first so EXPO_PUBLIC_* are available (Expo sometimes loads config before .env)
require('dotenv').config();

const raw = (process.env.EXPO_PUBLIC_API_URL || '').trim();
// Ensure URL has a scheme (default https for production hosts)
const apiUrl = raw.startsWith('http://') || raw.startsWith('https://')
  ? raw
  : raw ? `https://${raw}` : 'http://localhost:8000';

const { expo } = require('./app.json');

module.exports = {
  expo: {
    ...expo,
    extra: {
      apiUrl: apiUrl || 'http://localhost:8000',
    },
  },
};

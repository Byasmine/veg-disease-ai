// Load .env first so EXPO_PUBLIC_* are available (Expo sometimes loads config before .env)
require('dotenv').config();

function resolveUrl(rawValue, fallback) {
  const raw = String(rawValue || '').trim();
  if (!raw) return fallback;
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
}

const apiUrl = resolveUrl(process.env.EXPO_PUBLIC_API_URL, 'https://veg-disease-ai-production.up.railway.app');
const shopApiUrl = resolveUrl(process.env.EXPO_PUBLIC_SHOP_API_URL, 'http://localhost:8082');

const { expo } = require('./app.json');

module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      package: 'com.yasminebk.leafdoctor',
      // Dev APIs use http://10.0.2.2 (emulator) or LAN IP; Android blocks cleartext unless enabled.
      usesCleartextTraffic: true,
    },
    extra: {
      apiUrl,
      shopApiUrl,
      eas: {
        projectId: 'a00be9d7-17ce-4a67-8b57-2648970847ad',
      },
    },
  },
};

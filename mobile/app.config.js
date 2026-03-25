const path = require('path');

// Always load mobile/.env (cwd may be repo root or another folder when Expo runs)
require('dotenv').config({ path: path.join(__dirname, '.env') });

function resolveUrl(rawValue, fallback) {
  const raw = String(rawValue || '').trim();
  if (!raw) return fallback;
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
}

const apiUrl = resolveUrl(process.env.EXPO_PUBLIC_API_URL, 'https://veg-disease-ai-production.up.railway.app');
const shopApiUrl = resolveUrl(process.env.EXPO_PUBLIC_SHOP_API_URL, 'https://shop-backend-agilicis-leafdoctor.up.railway.app');

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

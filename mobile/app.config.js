// Load .env first so EXPO_PUBLIC_* are available (Expo sometimes loads config before .env)
require('dotenv').config();

function resolveUrl(rawValue, fallback) {
  const raw = String(rawValue || '').trim();
  if (!raw) return fallback;
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
}

const apiUrl = resolveUrl(process.env.EXPO_PUBLIC_API_URL, 'https://veg-disease-ai-production.up.railway.app');
const shopApiUrl = resolveUrl(process.env.EXPO_PUBLIC_SHOP_API_URL, 'http://localhost:8082');
const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '';
const firebaseAuthDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
const firebaseProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';
const firebaseStorageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
const firebaseMessagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '';
const firebaseAppId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '';

const { expo } = require('./app.json');

module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      package: 'com.yasminebk.leafdoctor',
    },
    extra: {
      apiUrl,
      shopApiUrl,
      firebase: {
        apiKey: firebaseApiKey,
        authDomain: firebaseAuthDomain,
        projectId: firebaseProjectId,
        storageBucket: firebaseStorageBucket,
        messagingSenderId: firebaseMessagingSenderId,
        appId: firebaseAppId,
      },
      eas: {
        projectId: 'a00be9d7-17ce-4a67-8b57-2648970847ad',
      },
    },
  },
};

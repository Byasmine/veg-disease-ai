import Constants from 'expo-constants';

/**
 * API base URL. Set EXPO_PUBLIC_API_URL in .env (loaded via app.config.js -> extra.apiUrl).
 * Restart dev server after changing .env: npx expo start -c
 */
function resolveUrl(value: unknown, fallback: string): string {
  if (!value) return fallback;
  const v = String(value).trim();
  if (!v) return fallback;
  return v.startsWith('http') ? v : `https://${v}`;
}

export const API_BASE_URL = resolveUrl(
  Constants.expoConfig?.extra?.apiUrl ?? (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : ''),
  'http://localhost:8000'
);

export const SHOP_API_BASE_URL = resolveUrl(
  Constants.expoConfig?.extra?.shopApiUrl ??
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SHOP_API_URL : ''),
  'http://localhost:8082'
);

type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export const FIREBASE_CONFIG: FirebasePublicConfig = {
  apiKey:
    Constants.expoConfig?.extra?.firebase?.apiKey ??
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_FIREBASE_API_KEY : '') ??
    '',
  authDomain:
    Constants.expoConfig?.extra?.firebase?.authDomain ??
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN : '') ??
    '',
  projectId:
    Constants.expoConfig?.extra?.firebase?.projectId ??
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_FIREBASE_PROJECT_ID : '') ??
    '',
  storageBucket:
    Constants.expoConfig?.extra?.firebase?.storageBucket ??
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET : '') ??
    '',
  messagingSenderId:
    Constants.expoConfig?.extra?.firebase?.messagingSenderId ??
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID : '') ??
    '',
  appId:
    Constants.expoConfig?.extra?.firebase?.appId ??
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_FIREBASE_APP_ID : '') ??
    '',
};

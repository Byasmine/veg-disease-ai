import Constants from 'expo-constants';

/**
 * API base URL. Set EXPO_PUBLIC_API_URL in .env (loaded via app.config.js → extra.apiUrl).
 * Defaults for local dev: http://localhost:8000
 * Restart dev server after changing .env: npx expo start -c
 */
function getApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl;
  if (fromExtra) return fromExtra;
  const fromEnv = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    const v = String(fromEnv).trim();
    return v.startsWith('http') ? v : `https://${v}`;
  }
  return 'http://localhost:8000';
}

export const API_BASE_URL = getApiBaseUrl();

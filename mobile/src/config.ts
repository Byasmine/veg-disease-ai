import { Platform } from 'react-native';
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

/** Metro / dev server host (LAN IP on a real device, often 10.0.2.2 on emulator). */
function devPackagerHostname(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const h = String(hostUri).split(':')[0]?.trim();
    if (h) return h;
  }
  const legacy = Constants as {
    expoGoConfig?: { debuggerHost?: string };
    manifest?: { debuggerHost?: string; hostUri?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string; debuggerHost?: string } } };
  };
  const dbg =
    legacy.expoGoConfig?.debuggerHost ??
    legacy.manifest?.debuggerHost ??
    legacy.manifest2?.extra?.expoClient?.debuggerHost;
  if (dbg) {
    const h = String(dbg).split(':')[0]?.trim();
    if (h) return h;
  }
  const m2host = legacy.manifest2?.extra?.expoClient?.hostUri ?? legacy.manifest?.hostUri;
  if (m2host) {
    const h = String(m2host).split(':')[0]?.trim();
    if (h) return h;
  }
  return null;
}

/**
 * Android: replace loopback with a host the device can reach.
 * - Emulator: usually `10.0.2.2` (or same as packager host).
 * - Physical device: prefer Metro `hostUri` (your PC LAN IP) when in dev.
 */
function mapLocalhostForAndroid(url: string): string {
  if (Platform.OS !== 'android') return url;
  try {
    const u = new URL(url);
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return url;

    let target = '10.0.2.2';
    if (__DEV__) {
      const packager = devPackagerHostname();
      if (packager && packager !== '127.0.0.1' && packager !== 'localhost') {
        target = packager;
      }
    }

    u.hostname = target;
    return u.href.replace(/\/$/, '');
  } catch {
    /* ignore */
  }
  return url;
}

const rawApi = resolveUrl(
  Constants.expoConfig?.extra?.apiUrl ?? (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : ''),
  'http://localhost:8000'
);

const rawShop = resolveUrl(
  Constants.expoConfig?.extra?.shopApiUrl ??
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SHOP_API_URL : ''),
  'http://localhost:8082'
);

export const API_BASE_URL = mapLocalhostForAndroid(rawApi);
/** Shop + JWT auth API (same host as shop-backend). */
export const SHOP_API_BASE_URL = mapLocalhostForAndroid(rawShop);

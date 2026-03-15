/**
 * API base URL. Set EXPO_PUBLIC_API_URL for production (e.g. Railway backend).
 * Defaults for local dev:
 * - Web: http://localhost:8000
 * - Android emulator: http://10.0.2.2:8000
 * - Real device (same Wi‑Fi): http://YOUR_PC_IP:8000
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:8000';

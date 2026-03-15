import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@veg_disease_scan_history';
const MAX_ENTRIES = 100;
const WEB_THUMB_MAX = 280;

export interface ScanHistoryEntry {
  id: string;
  timestamp: string;
  prediction: string;
  confidence: number;
  status: string;
  imageUri: string | null;
}

/**
 * On web, blob URLs die on refresh. Convert blob to a small base64 data URL so history thumbnails persist.
 */
export async function getPersistentImageUri(uri: string | null): Promise<string | null> {
  if (!uri) return null;
  if (Platform.OS !== 'web' || !uri.startsWith('blob:')) return uri;

  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    if (!dataUrl.startsWith('data:')) return uri;
    if (typeof createImageBitmap !== 'function') return dataUrl;
    const img = await createImageBitmap(blob);
    const w = img.width;
    const h = img.height;
    img.close();
    if (w <= WEB_THUMB_MAX && h <= WEB_THUMB_MAX) return dataUrl;
    const canvas = document.createElement('canvas');
    const scale = Math.min(WEB_THUMB_MAX / w, WEB_THUMB_MAX / h, 1);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    const img2 = await createImageBitmap(blob);
    ctx.drawImage(img2, 0, 0, canvas.width, canvas.height);
    img2.close();
    return canvas.toDataURL('image/jpeg', 0.75);
  } catch {
    return uri;
  }
}

export async function addScan(entry: Omit<ScanHistoryEntry, 'id'>): Promise<void> {
  const imageUri = await getPersistentImageUri(entry.imageUri);
  const list = await getScans();
  const newEntry: ScanHistoryEntry = {
    ...entry,
    imageUri,
    id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  };
  const next = [newEntry, ...list].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function getScans(): Promise<ScanHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

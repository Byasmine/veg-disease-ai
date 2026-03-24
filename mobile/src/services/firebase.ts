import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import { FIREBASE_CONFIG } from '../config';

const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);

let authInstance;

if (Platform.OS === 'web') {
  authInstance = getAuth(app);
  void setPersistence(authInstance, browserLocalPersistence).catch(() => undefined);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    authInstance = getAuth(app);
  }
}

export const firebaseApp = app;
export const firebaseAuth = authInstance;

import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
// @ts-ignore - React Native persistence helper
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

// --- Singleton Initialization ---
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

if (!getApps().length) {
  const configToUse = firebaseConfig.apiKey ? firebaseConfig : { ...firebaseConfig, apiKey: 'dummy-key-for-build' };
  firebaseApp = initializeApp(configToUse);
} else {
  firebaseApp = getApp();
}

try {
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  try {
    auth = getAuth(firebaseApp);
  } catch {
    auth = {} as Auth;
  }
}

try {
  firestore = initializeFirestore(firebaseApp, {
    ignoreUndefinedProperties: true,
  });
} catch (e) {
  try {
    firestore = getFirestore(firebaseApp);
  } catch {
    firestore = {} as Firestore;
  }
}

export { firebaseApp, auth, firestore };

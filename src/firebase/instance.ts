import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
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
  auth = getAuth(firebaseApp);
} catch (e) {
  auth = {} as Auth;
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

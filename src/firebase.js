import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Valid configuration detection
export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'your_firebase_api_key_here' &&
  projectId &&
  projectId !== 'your_project_id'
);

const firebaseConfig = {
  apiKey: apiKey || 'mock-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: projectId || 'wirk-local',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:12345:web:mock',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let appInstance = null;
let authInstance = null;
let dbInstance = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (err) {
    console.warn('[WIRK] Firebase initialization failed, running in local-first mode:', err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const APP_ID = 'wirk-v1';

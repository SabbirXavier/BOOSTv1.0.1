import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  EmailAuthProvider, 
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Use environment variables (highest priority from secrets)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';
export const db = getFirestore(app, databaseId); 
export const auth = getAuth(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();

export async function getAuthToken() {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export { RecaptchaVerifier, signInWithPhoneNumber };

export async function checkFirestoreConnection() {
  try {
    // If we're migrating to MongoDB, we can still check this for legacy or keep it as a fallback
    await withTimeout(getDocFromServer(doc(db, '_health', 'check')), 3000);
    return true;
  } catch (error: any) {
    if (error.code === 'permission-denied') return true;
    return false;
  }
}

export async function withTimeout<T>(promise: Promise<T>, ms: number = 8000): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Database operation timed out. Please check your internet or Firebase configuration.")), ms);
  });
  return Promise.race([promise, timeout]);
}

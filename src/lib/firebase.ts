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
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;
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

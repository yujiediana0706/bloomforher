import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import firebaseConfig from '../firebase/config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig.webAppConfig) : getApp();

// Target linked databaseId as mandated
export const db = getFirestore(app, firebaseConfig.databaseId);
export const auth = getAuth(app);

/**
 * Ensures user is authenticated before interacting with Cloud Firestore
 */
export async function ensureAuthenticated(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (err) {
          console.error('Anonymous sign-in failed', err);
          reject(err);
        }
      }
    });
  });
}

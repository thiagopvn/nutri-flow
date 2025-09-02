import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBONbiEVM8HwHWKMceRUN6HBt3e74Gaulk",
  authDomain: "nutriflow-ecf1a.firebaseapp.com",
  projectId: "nutriflow-ecf1a",
  storageBucket: "nutriflow-ecf1a.firebasestorage.app",
  messagingSenderId: "517484093603",
  appId: "1:517484093603:web:e987a75f7b77ca3b4e9f16",
  measurementId: "G-BP31018X82"
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only in browser environment
if (typeof window !== 'undefined') {
  getAnalytics(app);
}

export default app;
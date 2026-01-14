
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

/**
 * Zewu Interior Design - Firebase Configuration
 * 透過 process.env 讀取環境變數，避免金鑰洩漏
 */
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD9PObC6An5d6Zl41Y3bBRgXh0KyFUdx2I",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "zewu-a6e5d.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "zewu-a6e5d",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "zewu-a6e5d.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "832889344248",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:832889344248:web:a8652243e91fc085112b0d",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-36LJQSCXCW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { db, doc, setDoc, serverTimestamp, analytics };

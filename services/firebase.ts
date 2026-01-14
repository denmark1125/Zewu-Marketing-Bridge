
// Use v8 compatible imports to resolve module export errors
// Fix: Use compat versions to support v8 syntax on v9+ Firebase SDK
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';

/**
 * Zewu Interior Design - Firebase Security Configuration
 * 已移除硬編碼金鑰，請確保在 Vercel 或 .env 檔案中設定以下變數
 */
// Fix: Cast import.meta to any to resolve "Property 'env' does not exist" error
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID
};

// 安全檢查：若缺少 API Key 則顯示警告
if (!firebaseConfig.apiKey) {
  console.warn("Firebase API Key is missing. Please check your environment variables.");
}

// Initialize Firebase using v8 check to prevent multi-initialization errors
// Fix: Property 'apps' and 'initializeApp' now exist on compat import
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Fix: Property 'app' and 'firestore' now exist on compat import
const app = firebase.app();
const db = firebase.firestore();

/** 
 * Polyfill modular (v9) functional exports to maintain compatibility 
 * with components using doc(), setDoc(), and serverTimestamp()
 */
const doc = (dbInstance: any, collection: string, id: string) => {
  return dbInstance.collection(collection).doc(id);
};

const setDoc = (docRef: any, data: any, options?: any) => {
  return docRef.set(data, options);
};

// Fix: Property 'firestore' (for FieldValue) now exists on compat import
const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

// Initialize Analytics (僅在瀏覽器環境下執行)
let analytics: any;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try {
    // Fix: Property 'analytics' now exists on compat import
    analytics = firebase.analytics();
  } catch (e) {
    console.warn("Analytics initialization failed:", e);
  }
}

export { db, doc, setDoc, serverTimestamp, analytics };
export default app;
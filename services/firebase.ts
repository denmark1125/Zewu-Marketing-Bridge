
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore/lite';
import { getAnalytics, isSupported } from 'firebase/analytics';

// 強健的環境變數讀取工具
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {}
  return "";
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API') || getEnv('FIREBASE_API'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID') || getEnv('FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || getEnv('FIREBASE_MEASUREMENT_ID')
};

const isConfigValid = !!firebaseConfig.apiKey;

let app: any = null;
let db: any = null;
let analytics: any = null;

if (isConfigValid) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    
    if (typeof window !== 'undefined') {
      isSupported().then(yes => {
        if (yes) analytics = getAnalytics(app);
      });
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { 
  db, 
  doc, 
  setDoc, 
  serverTimestamp, 
  analytics 
};
export default app;

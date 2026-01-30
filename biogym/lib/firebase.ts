import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Debug: Log Firebase config (redact sensitive parts)
console.log('[Firebase] Initializing with config:', {
    apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    storageBucket: firebaseConfig.storageBucket || 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
    appId: firebaseConfig.appId ? '***' + firebaseConfig.appId.slice(-6) : 'MISSING',
});

// Initialize Firebase (prevent re-initialization in hot reload)
let app: FirebaseApp;
try {
    if (getApps().length === 0) {
        console.log('[Firebase] No existing app found, initializing new app...');
        app = initializeApp(firebaseConfig);
        console.log('[Firebase] ✅ App initialized successfully');
    } else {
        console.log('[Firebase] Using existing app instance');
        app = getApp();
    }
} catch (error) {
    console.error('[Firebase] ❌ Failed to initialize:', error);
    throw error;
}

// Initialize Firestore
let db: Firestore;
try {
    db = getFirestore(app);
    console.log('[Firebase] ✅ Firestore initialized successfully');
} catch (error) {
    console.error('[Firebase] ❌ Failed to initialize Firestore:', error);
    throw error;
}

export { db };
export default app;

import { initializeApp, getApps, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

let app: App | undefined;
let db: Firestore | undefined;
let initError: Error | null = null;

function initializeFirebaseAdmin(): { app: App; db: Firestore } {
    // Return cached instances if already initialized
    if (app && db) {
        return { app, db };
    }

    // Throw cached error if initialization previously failed
    if (initError) {
        throw initError;
    }

    try {
        if (getApps().length === 0) {
            const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

            if (serviceAccountKey) {
                // Parse the JSON credentials
                let credentials;
                try {
                    credentials = JSON.parse(serviceAccountKey);
                } catch (parseError) {
                    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
                }

                // Fix private key: replace literal \n with actual newlines
                // This is needed because env vars often store \n as literal characters
                if (credentials.private_key && typeof credentials.private_key === 'string') {
                    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
                }

                if (!credentials.project_id) {
                    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing project_id');
                }

                app = initializeApp({
                    credential: cert(credentials),
                    projectId: credentials.project_id,
                });
                console.log('[Firebase Admin] ✅ Initialized with service account key');
            } else if (projectId) {
                // Option 2: Use project ID with Application Default Credentials
                try {
                    app = initializeApp({
                        credential: applicationDefault(),
                        projectId,
                    });
                    console.log('[Firebase Admin] ✅ Initialized with Application Default Credentials');
                } catch (adcError) {
                    // Option 3: Initialize without credentials
                    app = initializeApp({
                        projectId,
                    });
                    console.log('[Firebase Admin] ✅ Initialized with project ID only (limited functionality)');
                }
            } else {
                throw new Error('Missing Firebase configuration: FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
            }
        } else {
            app = getApps()[0];
            console.log('[Firebase Admin] ✅ Using existing app instance');
        }

        db = getFirestore(app);
        return { app, db };
    } catch (error) {
        initError = error instanceof Error ? error : new Error(String(error));
        console.error('[Firebase Admin] ❌ Initialization error:', initError.message);
        throw initError;
    }
}

// Lazy initialization - don't initialize on import, initialize on first use
function getDb(): Firestore {
    if (!db) {
        initializeFirebaseAdmin();
    }
    if (!db) {
        throw new Error('Firebase Admin SDK not initialized');
    }
    return db;
}

function getApp(): App {
    if (!app) {
        initializeFirebaseAdmin();
    }
    if (!app) {
        throw new Error('Firebase Admin SDK not initialized');
    }
    return app;
}

// Export a proxy that initializes on first access
const dbProxy = new Proxy({} as Firestore, {
    get(_, prop) {
        const firestore = getDb();
        const value = (firestore as unknown as Record<string | symbol, unknown>)[prop];
        if (typeof value === 'function') {
            return value.bind(firestore);
        }
        return value;
    }
});

export { dbProxy as db, Timestamp, FieldValue, getApp };
export default getApp;

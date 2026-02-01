import { initializeApp, getApps, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        try {
            if (serviceAccountKey) {
                // Parse the JSON credentials
                let credentials = JSON.parse(serviceAccountKey);

                // Fix private key: replace literal \n with actual newlines
                // This is needed because env vars often store \n as literal characters
                if (credentials.private_key && typeof credentials.private_key === 'string') {
                    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
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
                throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
            }
        } catch (error) {
            console.error('[Firebase Admin] ❌ Initialization error:', error);
            throw error;
        }
    } else {
        app = getApps()[0];
    }

    db = getFirestore(app);
    return { app, db };
}

// Initialize on import
initializeFirebaseAdmin();

export { db, Timestamp, FieldValue };
export default app!;

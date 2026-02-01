
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    const status: any = {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        checks: {}
    };

    try {
        // Check 1: Env Var Presence
        const hasKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        status.checks.envVarPresent = hasKey;

        // DEBUG: List available keys (names only) to check for typos
        const availableKeys = Object.keys(process.env).filter(k => k.startsWith('FIREBASE'));
        status.debug = {
            foundFirebaseKeys: availableKeys,
            nodeEnv: process.env.NODE_ENV
        };

        if (!hasKey) {
            status.error = 'FIREBASE_SERVICE_ACCOUNT_KEY is missing from Production environment variables. Check Vercel Settings.';
            return NextResponse.json(status, { status: 500 });
        }

        // Check 2: JSON Parsing (manual check to be explicit)
        try {
            const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
            status.checks.jsonParse = 'Success';
            status.checks.projectId = creds.project_id; // Safe to expose
            status.checks.hasPrivateKey = !!creds.private_key;
        } catch (e) {
            status.checks.jsonParse = 'Failed';
            status.error = 'FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON';
            return NextResponse.json(status, { status: 500 });
        }

        // Check 3: Firestore Connection
        try {
            // Attempt a lightweight read (root collection list is not supported in client SDK, so read a dummy doc)
            const docRef = db.collection('_health_check').doc('ping');
            await docRef.get();
            status.checks.firestoreConnection = 'Success';
        } catch (e) {
            status.checks.firestoreConnection = 'Failed';
            status.error = e instanceof Error ? e.message : 'Unknown Firestore error';
            status.stack = e instanceof Error ? e.stack : undefined;
            return NextResponse.json(status, { status: 500 });
        }

        return NextResponse.json({ status: 'ok', ...status });

    } catch (error) {
        status.error = error instanceof Error ? error.message : 'Critical error';
        status.stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json(status, { status: 500 });
    }
}

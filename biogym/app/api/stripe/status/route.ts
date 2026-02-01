import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { getSubscription, canUserScan } from '@/lib/firestore-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('[STATUS API] Checking subscription status...');

    try {
        const { userId } = await auth();
        const user = await currentUser();
        console.log('[STATUS API] User ID:', userId);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let isPremium = false;
        let firestoreStatus = 'unknown';
        let stripeFallbackStatus = 'skipped';
        let debugError = null;

        // 1. Check Firestore
        try {
            const [firebaseSub, scanStatus] = await Promise.all([
                getSubscription(userId),
                canUserScan(userId),
            ]);

            firestoreStatus = firebaseSub.status || 'missing';

            if (firebaseSub.status === 'active' || firebaseSub.status === 'trialing') {
                isPremium = true;
            }

            // Return immediately if found
            if (isPremium) {
                return NextResponse.json({
                    subscription: { status: firebaseSub.status },
                    isPremium: true,
                    canScan: true,
                    scansRemaining: -1,
                    source: 'firestore'
                });
            }
        } catch (err) {
            console.error('[STATUS API] Firestore check failed:', err);
            debugError = err instanceof Error ? err.message : String(err);
            firestoreStatus = 'error';
        }

        // 2. Check Stripe Fallback (if Firestore failed or returned free)
        if (!isPremium) {
            const email = user?.emailAddresses?.[0]?.emailAddress;
            if (email) {
                try {
                    stripeFallbackStatus = 'checking';
                    const customers = await stripe.customers.list({ email, limit: 1 });
                    if (customers.data.length > 0) {
                        const customerId = customers.data[0].id;
                        const subscriptions = await stripe.subscriptions.list({
                            customer: customerId,
                            status: 'all', // Check all to be sure
                            limit: 1,
                        });

                        if (subscriptions.data.length > 0) {
                            const sub = subscriptions.data[0];
                            stripeFallbackStatus = sub.status;
                            if (sub.status === 'active' || sub.status === 'trialing') {
                                isPremium = true;
                                return NextResponse.json({
                                    subscription: { status: sub.status },
                                    isPremium: true,
                                    canScan: true,
                                    scansRemaining: -1,
                                    source: 'stripe_fallback'
                                });
                            }
                        } else {
                            stripeFallbackStatus = 'no_subscription';
                        }
                    } else {
                        stripeFallbackStatus = 'no_customer';
                    }
                } catch (stripeErr) {
                    console.error('[STATUS API] Stripe fallback failed:', stripeErr);
                    stripeFallbackStatus = 'error';
                }
            }
        }

        // If we get here, user is likely free
        // But we include debug info to help diagnose the "Already Subscribed" bug
        return NextResponse.json({
            subscription: { status: 'free' },
            isPremium: false,
            canScan: true, // Default to true for free tier (1 scan)
            scansRemaining: 1, // Default
            debug: {
                userId,
                firestoreStatus,
                stripeFallbackStatus,
                error: debugError
            }
        });

    } catch (error) {
        console.error('[STATUS API] Critical Error:', error);
        return NextResponse.json(
            { error: 'Failed to get subscription status' },
            { status: 500 }
        );
    }
}

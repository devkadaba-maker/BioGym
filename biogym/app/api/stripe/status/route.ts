import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';

interface SubscriptionStatus {
    status: 'free' | 'active' | 'trialing' | 'canceled' | 'past_due';
}

export async function GET() {
    console.log('[STATUS API] Checking subscription status...');

    try {
        const { userId } = await auth();
        const user = await currentUser();
        console.log('[STATUS API] User ID:', userId);

        if (!userId) {
            console.log('[STATUS API] ❌ No user ID - unauthorized');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Try Firebase first, fall back to Stripe if Firebase fails
        let subscription: SubscriptionStatus = { status: 'free' };
        let isPremium = false;
        let canScan = true;
        let scansRemaining = 1;

        try {
            // Dynamic import to avoid build-time Firebase initialization issues
            const { getSubscription, canUserScan } = await import('@/lib/firestore-admin');

            console.log('[STATUS API] Fetching subscription from Firebase...');
            const [firebaseSub, scanStatus] = await Promise.all([
                getSubscription(userId),
                canUserScan(userId),
            ]);

            console.log('[STATUS API] Firebase subscription:', JSON.stringify(firebaseSub));

            if (firebaseSub.status === 'active' || firebaseSub.status === 'trialing') {
                isPremium = true;
                subscription = { status: firebaseSub.status };
            }

            canScan = scanStatus.canScan;
            scansRemaining = scanStatus.scansRemaining;
        } catch (firebaseError) {
            console.error('[STATUS API] Firebase failed, checking Stripe directly:', firebaseError);

            // Fallback: Check Stripe directly using user email
            const email = user?.emailAddresses?.[0]?.emailAddress;
            if (email) {
                try {
                    const customers = await stripe.customers.list({ email, limit: 1 });
                    if (customers.data.length > 0) {
                        const customerId = customers.data[0].id;
                        const subscriptions = await stripe.subscriptions.list({
                            customer: customerId,
                            limit: 1,
                        });

                        if (subscriptions.data.length > 0) {
                            const stripeSub = subscriptions.data[0];
                            if (stripeSub.status === 'active' || stripeSub.status === 'trialing') {
                                isPremium = true;
                                subscription = {
                                    status: stripeSub.status === 'active' ? 'active' : 'trialing'
                                };
                                console.log('[STATUS API] ✅ Found active Stripe subscription');
                            }
                        }
                    }
                } catch (stripeError) {
                    console.error('[STATUS API] Stripe fallback also failed:', stripeError);
                }
            }
        }

        console.log('[STATUS API] isPremium:', isPremium);

        return NextResponse.json({
            subscription: {
                status: subscription.status,
            },
            isPremium,
            canScan: isPremium ? true : canScan,
            scansRemaining: isPremium ? -1 : scansRemaining,
        });
    } catch (error) {
        console.error('[STATUS API] ❌ Error:', error);
        return NextResponse.json(
            { error: 'Failed to get subscription status' },
            { status: 500 }
        );
    }
}

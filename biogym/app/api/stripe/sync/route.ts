import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { saveSubscription, getSubscription } from '@/lib/firestore-admin';
import Stripe from 'stripe';

// This endpoint syncs subscription status from Stripe to Firestore
// Used after checkout completion since webhooks don't work on localhost
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { sessionId } = body;

        console.log(`[SYNC] Syncing subscription for user ${userId}, session: ${sessionId}`);

        // If we have a session ID, get the subscription from it
        if (sessionId) {
            const session = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['subscription'],
            });

            if (session.subscription) {
                const subscription = (typeof session.subscription === 'string'
                    ? await stripe.subscriptions.retrieve(session.subscription)
                    : session.subscription) as Stripe.Subscription;

                let status: 'active' | 'trialing' | 'canceled' | 'past_due' = 'canceled';
                if (subscription.status === 'active') status = 'active';
                else if (subscription.status === 'trialing') status = 'trialing';
                else if (subscription.status === 'past_due') status = 'past_due';
                else if (subscription.status === 'canceled') status = 'canceled';

                await saveSubscription(userId, {
                    status,
                    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
                    stripeSubscriptionId: subscription.id,
                    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
                });

                console.log(`[SYNC] ✅ Subscription saved for user ${userId}, status: ${status}`);

                return NextResponse.json({
                    success: true,
                    status,
                    message: 'Subscription synced successfully'
                });
            }
        }

        // No session ID - try to find subscription from Stripe customer
        // First get existing subscription to find customer ID
        const existing = await getSubscription(userId);
        let stripeCustomerId = existing.stripeCustomerId;

        // Implementation Note: If customer ID is missing (e.g. webhook failed), try to find by email
        if (!stripeCustomerId) {
            try {
                // We need to fetch the user's email from Clerk
                // Note: We can't use currentUser() here easily because we are already in an async function 
                // and importing it might conflict or require restructuring. 
                // Instead, we will assume the client might pass email, or we rely on the webhook to have worked eventually.
                // BUT, since we are fixing a critical "nothing happens" bug, we should try to get the user.
                const { currentUser } = await import('@clerk/nextjs/server');
                const user = await currentUser();
                const email = user?.emailAddresses?.[0]?.emailAddress;

                if (email) {
                    console.log(`[SYNC] Looking up Stripe customer by email: ${email}`);
                    const customers = await stripe.customers.list({ email, limit: 1 });
                    if (customers.data.length > 0) {
                        stripeCustomerId = customers.data[0].id;
                        console.log(`[SYNC] Found Stripe customer ID via email: ${stripeCustomerId}`);
                    }
                }
            } catch (err) {
                console.warn('[SYNC] Failed to lookup customer by email:', err);
            }
        }

        if (stripeCustomerId) {
            // Check for active subscriptions on this customer
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                limit: 1,
            });

            if (subscriptions.data.length > 0) {
                const subscription = subscriptions.data[0] as Stripe.Subscription;
                let status: 'active' | 'trialing' | 'canceled' | 'past_due' = 'canceled';
                if (subscription.status === 'active') status = 'active';
                else if (subscription.status === 'trialing') status = 'trialing';
                else if (subscription.status === 'past_due') status = 'past_due';
                else if (subscription.status === 'canceled') status = 'canceled';

                await saveSubscription(userId, {
                    status,
                    stripeCustomerId: stripeCustomerId,
                    stripeSubscriptionId: subscription.id,
                    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
                });

                console.log(`[SYNC] ✅ Subscription synced from customer for user ${userId}`);

                return NextResponse.json({
                    success: true,
                    status,
                    message: 'Subscription synced from customer'
                });
            }
        }

        return NextResponse.json({
            success: false,
            message: 'No subscription found to sync'
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('[SYNC] Error syncing subscription:', errorMessage);
        console.error('[SYNC] Stack:', errorStack);

        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json(
            {
                error: isDev ? errorMessage : 'Failed to sync subscription',
                ...(isDev && { stack: errorStack })
            },
            { status: 500 }
        );
    }
}

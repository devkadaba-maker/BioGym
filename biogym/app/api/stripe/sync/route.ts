import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { saveSubscription, getSubscription } from '@/lib/firestore-admin';

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
                const subscription = typeof session.subscription === 'string'
                    ? await stripe.subscriptions.retrieve(session.subscription)
                    : session.subscription;

                const status = subscription.status === 'trialing' ? 'trialing' :
                    subscription.status === 'active' ? 'active' : subscription.status;

                await saveSubscription(userId, {
                    status: status as 'active' | 'trialing' | 'canceled' | 'past_due' | 'inactive',
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: subscription.id,
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
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

        if (existing.stripeCustomerId) {
            // Check for active subscriptions on this customer
            const subscriptions = await stripe.subscriptions.list({
                customer: existing.stripeCustomerId,
                limit: 1,
            });

            if (subscriptions.data.length > 0) {
                const subscription = subscriptions.data[0];
                const status = subscription.status === 'trialing' ? 'trialing' :
                    subscription.status === 'active' ? 'active' : subscription.status;

                await saveSubscription(userId, {
                    status: status as 'active' | 'trialing' | 'canceled' | 'past_due' | 'inactive',
                    stripeCustomerId: existing.stripeCustomerId,
                    stripeSubscriptionId: subscription.id,
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
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
        console.error('[SYNC] Error syncing subscription:', error);
        return NextResponse.json(
            { error: 'Failed to sync subscription' },
            { status: 500 }
        );
    }
}

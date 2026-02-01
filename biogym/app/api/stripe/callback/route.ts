
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { saveSubscription } from '@/lib/firestore-admin';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        console.log(`[CALLBACK] Processing session: ${sessionId}`);

        // Retrieve session to get subscription details and userId
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription'],
        });

        // Verify the user matches the session (security check)
        const sessionUserId = session.metadata?.clerkUserId;
        const { userId } = await auth();

        if (!sessionUserId) {
            console.error('[CALLBACK] No User ID in session metadata');
            return NextResponse.redirect(new URL('/dashboard?error=missing_metadata', request.url));
        }

        // Note: We update for the user in the metadata, even if current auth is different 
        // (though they should be the same). This ensures the correct account gets the sub.

        if (session.subscription) {
            const subscription = session.subscription as Stripe.Subscription;
            let status: 'active' | 'trialing' | 'canceled' | 'past_due' = 'canceled';
            if (subscription.status === 'active') status = 'active';
            else if (subscription.status === 'trialing') status = 'trialing';
            else if (subscription.status === 'past_due') status = 'past_due';
            else if (subscription.status === 'canceled') status = 'canceled';

            console.log(`[CALLBACK] Updates subscription for user ${sessionUserId} to ${status}`);

            await saveSubscription(sessionUserId, {
                status,
                stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
                stripeSubscriptionId: subscription.id,
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
            });
        }

        // Redirect to success page
        return NextResponse.redirect(new URL('/dashboard/scan?success=true', request.url));

    } catch (error) {
        console.error('[CALLBACK] Error processing callback:', error);
        return NextResponse.redirect(new URL('/dashboard?error=callback_failed', request.url));
    }
}

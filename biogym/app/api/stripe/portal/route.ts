import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { getSubscription } from '@/lib/firestore-admin';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user's subscription to find their Stripe customer ID
        const subscription = await getSubscription(userId);

        if (!subscription.stripeCustomerId) {
            return NextResponse.json(
                { error: 'No subscription found' },
                { status: 400 }
            );
        }

        // Check if this is a manually overridden subscription (not a real Stripe customer)
        if (subscription.stripeCustomerId.startsWith('manual_') ||
            !subscription.stripeCustomerId.startsWith('cus_')) {
            return NextResponse.json(
                {
                    error: 'Manual subscription - no billing portal available',
                    isManualOverride: true
                },
                { status: 400 }
            );
        }

        const origin = request.headers.get('origin') || 'http://localhost:3000';

        // Create portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${origin}/dashboard/scan`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        console.error('Portal session error:', error);
        return NextResponse.json(
            { error: 'Failed to create portal session' },
            { status: 500 }
        );
    }
}

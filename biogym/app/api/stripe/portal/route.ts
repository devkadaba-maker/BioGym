import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSubscription, saveSubscription } from '@/lib/firestore-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to get customer ID from Firestore
        let stripeCustomerId: string | undefined;

        try {
            const subscription = await getSubscription(userId);
            stripeCustomerId = subscription.stripeCustomerId;
        } catch (dbErr) {
            console.warn('[PORTAL] Firestore lookup failed:', dbErr);
        }

        // Fallback: Look up customer by email in Stripe
        if (!stripeCustomerId) {
            const email = user?.emailAddresses?.[0]?.emailAddress;
            if (email) {
                console.log('[PORTAL] Looking up Stripe customer by email:', email);
                const customers = await stripe.customers.list({ email, limit: 1 });
                if (customers.data.length > 0) {
                    stripeCustomerId = customers.data[0].id;
                    console.log('[PORTAL] Found customer via email:', stripeCustomerId);

                    // Save it to Firestore for next time (best effort)
                    try {
                        const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, limit: 1 });
                        if (subs.data.length > 0) {
                            const sub = subs.data[0];
                            await saveSubscription(userId, {
                                status: sub.status === 'active' ? 'active' : sub.status === 'trialing' ? 'trialing' : 'canceled',
                                stripeCustomerId,
                                stripeSubscriptionId: sub.id,
                                currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
                                cancelAtPeriodEnd: sub.cancel_at_period_end,
                            });
                            console.log('[PORTAL] Saved subscription to Firestore');
                        }
                    } catch (saveErr) {
                        console.warn('[PORTAL] Failed to save subscription:', saveErr);
                    }
                }
            }
        }

        if (!stripeCustomerId) {
            return NextResponse.json(
                { error: 'No Stripe customer found for your account' },
                { status: 400 }
            );
        }

        // Check if this is a manually overridden subscription
        if (stripeCustomerId.startsWith('manual_') || !stripeCustomerId.startsWith('cus_')) {
            return NextResponse.json(
                { error: 'Manual subscription - no billing portal available', isManualOverride: true },
                { status: 400 }
            );
        }

        const origin = request.headers.get('origin') || 'http://localhost:3000';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${origin}/dashboard/scan`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        console.error('[PORTAL] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create portal session' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSubscription } from '@/lib/firestore-admin';

export async function POST(request: NextRequest) {
    console.log('[CHECKOUT] Starting checkout session creation...');

    try {
        const { userId } = await auth();
        const user = await currentUser();

        console.log('[CHECKOUT] User ID:', userId);

        if (!userId || !user) {
            console.log('[CHECKOUT] ❌ No user - unauthorized');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user already has an active subscription in Firestore
        // Wrap in try-catch so Firebase issues don't block checkout
        try {
            const existingSubscription = await getSubscription(userId);
            console.log('[CHECKOUT] Existing subscription status:', existingSubscription.status);

            if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
                console.log(`[CHECKOUT] ❌ User ${userId} already has active subscription`);
                return NextResponse.json(
                    { error: 'You already have an active subscription', alreadySubscribed: true },
                    { status: 400 }
                );
            }
        } catch (firebaseError) {
            // Log but continue - don't block checkout if Firebase has issues
            console.error('[CHECKOUT] Firebase check failed (continuing anyway):', firebaseError);
        }

        const email = user.emailAddresses?.[0]?.emailAddress;
        console.log('[CHECKOUT] User email:', email);

        if (!email) {
            console.log('[CHECKOUT] ❌ No email address found');
            return NextResponse.json(
                { error: 'No email address found' },
                { status: 400 }
            );
        }

        // Check if customer already exists in Stripe
        console.log('[CHECKOUT] Checking for existing Stripe customer...');
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1,
        });

        let customerId: string;
        if (existingCustomers.data.length > 0) {
            customerId = existingCustomers.data[0].id;
            console.log('[CHECKOUT] Found existing customer:', customerId);

            // Check if the Stripe customer already has an active subscription
            const [activeSubscriptions, trialingSubscriptions] = await Promise.all([
                stripe.subscriptions.list({
                    customer: customerId,
                    status: 'active',
                    limit: 1,
                }),
                stripe.subscriptions.list({
                    customer: customerId,
                    status: 'trialing',
                    limit: 1,
                }),
            ]);

            if (activeSubscriptions.data.length > 0 || trialingSubscriptions.data.length > 0) {
                console.log(`[CHECKOUT] ❌ Stripe customer ${customerId} already has active subscription`);
                return NextResponse.json(
                    { error: 'You already have an active subscription', alreadySubscribed: true },
                    { status: 400 }
                );
            }
        } else {
            // Create new customer
            console.log('[CHECKOUT] Creating new Stripe customer...');
            const customer = await stripe.customers.create({
                email: email,
                metadata: {
                    clerkUserId: userId,
                },
            });
            customerId = customer.id;
            console.log('[CHECKOUT] Created new customer:', customerId);
        }

        // Get the base URL from request
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        console.log('[CHECKOUT] Origin:', origin);

        // Create checkout session with 7-day trial
        console.log('[CHECKOUT] Creating checkout session...');
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID!,
                    quantity: 1,
                },
            ],
            subscription_data: {
                trial_period_days: 7,
                metadata: {
                    clerkUserId: userId,
                },
            },
            success_url: `${origin}/api/stripe/callback?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pricing?canceled=true`,
            metadata: {
                clerkUserId: userId,
            },
        });

        console.log('[CHECKOUT] ✅ Session created:', session.id);
        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[CHECKOUT] ❌ Checkout session error:', error);
        if (error instanceof Error) {
            console.error('[CHECKOUT] Error message:', error.message);
            console.error('[CHECKOUT] Error stack:', error.stack);
        }
        return NextResponse.json(
            { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

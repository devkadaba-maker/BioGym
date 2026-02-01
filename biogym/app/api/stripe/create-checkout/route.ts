import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSubscription } from '@/lib/firestore-admin';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // FIRST: Check if user already has an active subscription in Firestore
        const existingSubscription = await getSubscription(userId);
        if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
            console.log(`[CHECKOUT] User ${userId} already has active subscription`);
            return NextResponse.json(
                { error: 'You already have an active subscription', alreadySubscribed: true },
                { status: 400 }
            );
        }

        const email = user.emailAddresses?.[0]?.emailAddress;
        if (!email) {
            return NextResponse.json(
                { error: 'No email address found' },
                { status: 400 }
            );
        }

        // Check if customer already exists in Stripe
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1,
        });

        let customerId: string;
        if (existingCustomers.data.length > 0) {
            customerId = existingCustomers.data[0].id;

            // ALSO: Check if the Stripe customer already has an active subscription
            const activeSubscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 1,
            });

            const trialingSubscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'trialing',
                limit: 1,
            });

            if (activeSubscriptions.data.length > 0 || trialingSubscriptions.data.length > 0) {
                console.log(`[CHECKOUT] Stripe customer ${customerId} already has active subscription`);
                return NextResponse.json(
                    { error: 'You already have an active subscription', alreadySubscribed: true },
                    { status: 400 }
                );
            }
        } else {
            // Create new customer
            const customer = await stripe.customers.create({
                email: email,
                metadata: {
                    clerkUserId: userId,
                },
            });
            customerId = customer.id;
        }

        // Get the base URL from request
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        // Create checkout session with 7-day trial
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
            // On success, we'll sync the subscription from Stripe
            success_url: `${origin}/dashboard/scan?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pricing?canceled=true`,
            metadata: {
                clerkUserId: userId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout session error:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        }
        return NextResponse.json(
            { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

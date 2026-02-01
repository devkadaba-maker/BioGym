import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';

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

        const email = user.emailAddresses?.[0]?.emailAddress;
        if (!email) {
            return NextResponse.json(
                { error: 'No email address found' },
                { status: 400 }
            );
        }

        // Check if customer already exists
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1,
        });

        let customerId: string;
        if (existingCustomers.data.length > 0) {
            customerId = existingCustomers.data[0].id;
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
        // Note: Removing payment_method_types allows Stripe to automatically enable
        // all payment methods configured in your Stripe Dashboard, including:
        // - Card payments
        // - Apple Pay (on Safari/iOS)
        // - Google Pay (on Chrome/Android)
        // - Link (Stripe's one-click checkout)
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            // Allow all payment methods configured in Stripe Dashboard
            // This enables Apple Pay, Google Pay, and other wallets automatically
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
            success_url: `${origin}/dashboard/scan?success=true`,
            cancel_url: `${origin}/pricing?canceled=true`,
            metadata: {
                clerkUserId: userId,
            },
            // Enable automatic tax calculation if configured in Stripe
            // automatic_tax: { enabled: true },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout session error:', error);
        // Log more details for debugging
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        console.error('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID);
        return NextResponse.json(
            { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

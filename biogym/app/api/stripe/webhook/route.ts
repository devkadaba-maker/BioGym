import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { saveSubscription } from '@/lib/firestore-admin';
import { sendTrialNotification } from '@/lib/email';
import Stripe from 'stripe';

// Stripe requires raw body for webhook verification
export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
            { error: 'Webhook signature verification failed' },
            { status: 400 }
        );
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const clerkUserId = session.metadata?.clerkUserId;

                if (clerkUserId && session.subscription) {
                    const subscriptionResponse = await stripe.subscriptions.retrieve(
                        session.subscription as string
                    );

                    // Access the subscription data
                    const subData = subscriptionResponse as unknown as {
                        id: string;
                        status: string;
                        current_period_end: number;
                        cancel_at_period_end: boolean;
                        trial_end: number | null;
                        metadata?: { clerkUserId?: string };
                    };

                    const status = subData.status === 'trialing' ? 'trialing' : 'active';

                    await saveSubscription(clerkUserId, {
                        status,
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: subData.id,
                        currentPeriodEnd: new Date(subData.current_period_end * 1000),
                        cancelAtPeriodEnd: subData.cancel_at_period_end,
                        trialEnd: subData.trial_end
                            ? new Date(subData.trial_end * 1000)
                            : undefined,
                    });

                    // Send notification if it's a trial
                    if (status === 'trialing') {
                        const userEmail = session.customer_details?.email || undefined;
                        await sendTrialNotification(userEmail, clerkUserId);
                    }

                    console.log(`✅ Subscription activated for user ${clerkUserId}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subEvent = event.data.object as unknown as {
                    id: string;
                    status: string;
                    current_period_end: number;
                    cancel_at_period_end: boolean;
                    trial_end: number | null;
                    metadata?: { clerkUserId?: string };
                };
                const clerkUserId = subEvent.metadata?.clerkUserId;

                if (clerkUserId) {
                    let status: 'active' | 'canceled' | 'past_due' | 'trialing' = 'active';

                    if (subEvent.status === 'trialing') {
                        status = 'trialing';
                    } else if (subEvent.status === 'past_due') {
                        status = 'past_due';
                    } else if (subEvent.status === 'canceled' || subEvent.cancel_at_period_end) {
                        status = 'canceled';
                    }

                    await saveSubscription(clerkUserId, {
                        status,
                        currentPeriodEnd: new Date(subEvent.current_period_end * 1000),
                        cancelAtPeriodEnd: subEvent.cancel_at_period_end,
                        trialEnd: subEvent.trial_end
                            ? new Date(subEvent.trial_end * 1000)
                            : undefined,
                    });

                    console.log(`✅ Subscription updated for user ${clerkUserId}: ${status}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subDeleted = event.data.object as unknown as {
                    metadata?: { clerkUserId?: string };
                };
                const clerkUserId = subDeleted.metadata?.clerkUserId;

                if (clerkUserId) {
                    await saveSubscription(clerkUserId, {
                        status: 'free',
                        stripeSubscriptionId: undefined,
                        currentPeriodEnd: undefined,
                        cancelAtPeriodEnd: false,
                        trialEnd: undefined,
                    });

                    console.log(`✅ Subscription canceled for user ${clerkUserId}`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as unknown as {
                    subscription?: string;
                };
                const subscriptionId = invoice.subscription;

                if (subscriptionId) {
                    const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
                    const subData = subscriptionResponse as unknown as {
                        metadata?: { clerkUserId?: string };
                    };
                    const clerkUserId = subData.metadata?.clerkUserId;

                    if (clerkUserId) {
                        await saveSubscription(clerkUserId, {
                            status: 'past_due',
                        });

                        console.log(`⚠️ Payment failed for user ${clerkUserId}`);
                    }
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSubscription, canUserScan } from '@/lib/firestore-admin';

export async function GET() {
    console.log('[STATUS API] Checking subscription status...');

    try {
        const { userId } = await auth();
        console.log('[STATUS API] User ID:', userId);

        if (!userId) {
            console.log('[STATUS API] ❌ No user ID - unauthorized');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[STATUS API] Fetching subscription for:', userId);
        const [subscription, scanStatus] = await Promise.all([
            getSubscription(userId),
            canUserScan(userId),
        ]);

        console.log('[STATUS API] Subscription data:', JSON.stringify(subscription));
        console.log('[STATUS API] Scan status:', JSON.stringify(scanStatus));

        const isPremium = subscription.status === 'active' || subscription.status === 'trialing';
        console.log('[STATUS API] isPremium:', isPremium);

        return NextResponse.json({
            subscription: {
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                trialEnd: subscription.trialEnd?.toISOString(),
            },
            isPremium,
            canScan: scanStatus.canScan,
            scansRemaining: scanStatus.scansRemaining,
        });
    } catch (error) {
        console.error('[STATUS API] ❌ Error:', error);
        return NextResponse.json(
            { error: 'Failed to get subscription status' },
            { status: 500 }
        );
    }
}


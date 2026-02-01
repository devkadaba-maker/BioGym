import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSubscription, canUserScan } from '@/lib/firestore';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const [subscription, scanStatus] = await Promise.all([
            getSubscription(userId),
            canUserScan(userId),
        ]);

        const isPremium = subscription.status === 'active' || subscription.status === 'trialing';

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
        console.error('Status check error:', error);
        return NextResponse.json(
            { error: 'Failed to get subscription status' },
            { status: 500 }
        );
    }
}

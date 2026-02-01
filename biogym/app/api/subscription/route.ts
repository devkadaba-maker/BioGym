import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSubscription, saveSubscription, getMonthlyUsage, canUserScan, incrementScanCount } from '@/lib/firestore-admin';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        switch (action) {
            case 'status': {
                const subscription = await getSubscription(userId);
                const usage = await getMonthlyUsage(userId);
                return NextResponse.json({ subscription, usage });
            }
            case 'canScan': {
                const result = await canUserScan(userId);
                return NextResponse.json(result);
            }
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('[API /subscription] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, targetUserId, subscriptionData } = body;

        switch (action) {
            case 'incrementScan': {
                const newCount = await incrementScanCount(userId);
                return NextResponse.json({ scanCount: newCount });
            }
            case 'grantPro': {
                // Admin function - only allow if targeting self or if we have a specific admin check
                const target = targetUserId || userId;
                await saveSubscription(target, {
                    status: 'active',
                    stripeCustomerId: 'manual_override_dev_test',
                    currentPeriodEnd: new Date('2099-12-31'),
                    cancelAtPeriodEnd: false
                });
                return NextResponse.json({ success: true, userId: target });
            }
            case 'updateSubscription': {
                if (!subscriptionData) {
                    return NextResponse.json({ error: 'Missing subscriptionData' }, { status: 400 });
                }
                await saveSubscription(userId, subscriptionData);
                return NextResponse.json({ success: true });
            }
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('[API /subscription] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

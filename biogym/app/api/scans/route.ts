import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getScanHistory, getLatestScan, calculateStreak, getAverageDensities } from '@/lib/firestore-admin';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const action = url.searchParams.get('action') || 'history';
        const limit = parseInt(url.searchParams.get('limit') || '50');

        switch (action) {
            case 'history': {
                const scans = await getScanHistory(userId, limit);
                return NextResponse.json({ scans });
            }
            case 'latest': {
                const scan = await getLatestScan(userId);
                return NextResponse.json({ scan });
            }
            case 'streak': {
                const streak = await calculateStreak(userId);
                return NextResponse.json(streak);
            }
            case 'averages': {
                const averages = await getAverageDensities(userId);
                return NextResponse.json(averages);
            }
            case 'progress': {
                // Combined data for progress page
                const [scans, streak, averages] = await Promise.all([
                    getScanHistory(userId, 50),
                    calculateStreak(userId),
                    getAverageDensities(userId),
                ]);
                return NextResponse.json({ scans, streak, averages });
            }
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('[API /scans] Error:', errorMessage);
        console.error('[API /scans] Stack:', errorStack);

        // Return more info in development, less in production
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json({
            error: isDev ? errorMessage : 'Internal server error',
            ...(isDev && { stack: errorStack })
        }, { status: 500 });
    }
}

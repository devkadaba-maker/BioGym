import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getExerciseLogs, saveExerciseLog } from '@/lib/firestore-admin';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const logs = await getExerciseLogs(userId, limit);
        return NextResponse.json({ logs });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('[API /workouts] Error:', errorMessage);
        console.error('[API /workouts] Stack:', errorStack);

        // Return more info in development, less in production
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json({
            error: isDev ? errorMessage : 'Internal server error',
            ...(isDev && { stack: errorStack })
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { exercise } = body;

        if (!exercise || !exercise.name) {
            return NextResponse.json({ error: 'Missing exercise data' }, { status: 400 });
        }

        const docId = await saveExerciseLog(userId, exercise);
        return NextResponse.json({ success: true, id: docId });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('[API /workouts] POST Error:', errorMessage);
        console.error('[API /workouts] POST Stack:', errorStack);

        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json({
            error: isDev ? errorMessage : 'Internal server error',
            ...(isDev && { stack: errorStack })
        }, { status: 500 });
    }
}

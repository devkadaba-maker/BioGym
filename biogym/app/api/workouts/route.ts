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
        console.error('[API /workouts] Error:', error);
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
        const { exercise } = body;

        if (!exercise || !exercise.name) {
            return NextResponse.json({ error: 'Missing exercise data' }, { status: 400 });
        }

        const docId = await saveExerciseLog(userId, exercise);
        return NextResponse.json({ success: true, id: docId });
    } catch (error) {
        console.error('[API /workouts] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

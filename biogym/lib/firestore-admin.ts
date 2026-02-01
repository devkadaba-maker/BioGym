import { db, Timestamp, FieldValue } from './firebase-admin';

// Types for scan data
export interface ScanAnalysis {
    chest_density: number;
    arms_density: number;
    legs_density: number;
    core_density: number;
    primary_weakness?: string;
    hotspots?: Array<{
        zone: string;
        coords: { x: number; y: number };
        description: string;
    }>;
}

export interface ScanRecommendation {
    protocol_name: string;
    focus_area: string;
    exercises: Array<{
        workoutId: string;
        name: string;
        reps: string;
        sets: string;
        time?: string;
        focus?: string;
        difficulty?: string;
        why?: string;
    }>;
}

export interface ScanDetails {
    arms: { left: string; right: string };
    chest: string;
    core: string;
    legs: { left: string; right: string };
}

export interface ScanRecord {
    id?: string;
    userId: string;
    timestamp: Date;
    analysis: ScanAnalysis;
    recommendation?: ScanRecommendation;
    Details?: ScanDetails;
}

export interface StreakData {
    current: number;
    best: number;
    lastScanDate: Date | null;
}

export interface AverageDensities {
    chest: number;
    arms: number;
    legs: number;
    core: number;
    overall: number;
}

export interface ExerciseLog {
    id?: string;
    userId: string;
    timestamp: Date;
    exerciseName: string;
    sets: string;
    reps: string;
    time?: string;
    actualDuration?: number;
    focus: string;
    difficulty?: string;
    workoutId?: string;
}

export interface UserSubscription {
    status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    trialEnd?: Date;
}

export interface MonthlyUsage {
    scanCount: number;
    monthYear: string;
}

/**
 * Save a scan result to Firestore
 */
export async function saveScanResult(
    userId: string,
    scanData: {
        status: string;
        analysis?: ScanAnalysis;
        recommendation?: ScanRecommendation;
        Details?: ScanDetails;
    }
): Promise<string> {
    console.log("[firestore-admin] saveScanResult called for user:", userId);

    if (!scanData.analysis) {
        throw new Error('No analysis data to save');
    }

    const scansRef = db.collection('users').doc(userId).collection('scans');

    const docData = {
        userId,
        timestamp: Timestamp.now(),
        analysis: scanData.analysis,
        recommendation: scanData.recommendation || null,
        Details: scanData.Details || null,
    };

    const docRef = await scansRef.add(docData);
    console.log("[firestore-admin] ✅ Scan saved with ID:", docRef.id);
    return docRef.id;
}

/**
 * Save exercise log
 */
export async function saveExerciseLog(
    userId: string,
    exercise: {
        name: string;
        sets: string;
        reps: string;
        time: string;
        actualDuration?: number;
        focus: string;
        difficulty?: string;
        workoutId?: string;
    }
): Promise<string> {
    const workoutsRef = db.collection('users').doc(userId).collection('workouts');

    const docData = {
        userId,
        timestamp: Timestamp.now(),
        exerciseName: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        time: exercise.time,
        actualDuration: exercise.actualDuration || 0,
        focus: exercise.focus,
        difficulty: exercise.difficulty || 'intermediate',
        workoutId: exercise.workoutId || 'custom',
    };

    const docRef = await workoutsRef.add(docData);
    return docRef.id;
}

/**
 * Get exercise logs for a user
 */
export async function getExerciseLogs(
    userId: string,
    maxResults: number = 50
): Promise<ExerciseLog[]> {
    const workoutsRef = db.collection('users').doc(userId).collection('workouts');
    const snapshot = await workoutsRef.orderBy('timestamp', 'desc').limit(maxResults).get();

    const logs: ExerciseLog[] = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
            id: doc.id,
            userId: data.userId,
            timestamp: data.timestamp.toDate(),
            exerciseName: data.exerciseName,
            sets: data.sets,
            reps: data.reps,
            time: data.time,
            actualDuration: data.actualDuration,
            focus: data.focus,
            difficulty: data.difficulty,
            workoutId: data.workoutId,
        });
    });

    return logs;
}

/**
 * Get scan history for a user
 */
export async function getScanHistory(
    userId: string,
    maxResults: number = 50
): Promise<ScanRecord[]> {
    const scansRef = db.collection('users').doc(userId).collection('scans');
    const snapshot = await scansRef.orderBy('timestamp', 'desc').limit(maxResults).get();

    const scans: ScanRecord[] = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        scans.push({
            id: doc.id,
            userId: data.userId,
            timestamp: data.timestamp.toDate(),
            analysis: data.analysis,
            recommendation: data.recommendation,
            Details: data.Details,
        });
    });

    return scans;
}

/**
 * Get latest scan
 */
export async function getLatestScan(userId: string): Promise<ScanRecord | null> {
    const scans = await getScanHistory(userId, 1);
    return scans.length > 0 ? scans[0] : null;
}

/**
 * Calculate streak
 */
export async function calculateStreak(userId: string): Promise<StreakData> {
    const scans = await getScanHistory(userId, 365);

    if (scans.length === 0) {
        return { current: 0, best: 0, lastScanDate: null };
    }

    const getLocalDateStr = (date: Date) => date.toLocaleDateString('en-CA');

    const uniqueDates = new Set<string>();
    scans.forEach((scan) => uniqueDates.add(getLocalDateStr(scan.timestamp)));

    const sortedDates = Array.from(uniqueDates).sort().reverse();

    const today = new Date();
    const todayStr = getLocalDateStr(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    let currentStreak = 0;
    let checkDateStr = todayStr;

    if (sortedDates.includes(todayStr)) {
        checkDateStr = todayStr;
    } else if (sortedDates.includes(yesterdayStr)) {
        checkDateStr = yesterdayStr;
    } else {
        currentStreak = 0;
    }

    if (sortedDates.includes(checkDateStr)) {
        currentStreak = 1;
        let dateToCheck = new Date(checkDateStr);

        while (true) {
            dateToCheck.setDate(dateToCheck.getDate() - 1);
            const prevDateStr = getLocalDateStr(dateToCheck);
            if (sortedDates.includes(prevDateStr)) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    let bestStreak = 0;
    let tempStreak = 0;
    const sortedAsc = [...sortedDates].reverse();

    for (let i = 0; i < sortedAsc.length; i++) {
        if (tempStreak === 0) {
            tempStreak = 1;
        } else {
            const curr = new Date(sortedAsc[i]);
            const prev = new Date(sortedAsc[i - 1]);
            const diffDays = Math.ceil(Math.abs(curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                bestStreak = Math.max(bestStreak, tempStreak);
                tempStreak = 1;
            }
        }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    if (currentStreak > bestStreak) bestStreak = currentStreak;

    return { current: currentStreak, best: bestStreak, lastScanDate: scans[0]?.timestamp || null };
}

/**
 * Get average densities
 */
export async function getAverageDensities(userId: string): Promise<AverageDensities> {
    const scans = await getScanHistory(userId);

    if (scans.length === 0) {
        return { chest: 0, arms: 0, legs: 0, core: 0, overall: 0 };
    }

    let totalChest = 0, totalArms = 0, totalLegs = 0, totalCore = 0;

    scans.forEach((scan) => {
        totalChest += scan.analysis.chest_density || 0;
        totalArms += scan.analysis.arms_density || 0;
        totalLegs += scan.analysis.legs_density || 0;
        totalCore += scan.analysis.core_density || 0;
    });

    const count = scans.length;
    const chest = totalChest / count;
    const arms = totalArms / count;
    const legs = totalLegs / count;
    const core = totalCore / count;
    const overall = (chest + arms + legs + core) / 4;

    return {
        chest: Number(chest.toFixed(1)),
        arms: Number(arms.toFixed(1)),
        legs: Number(legs.toFixed(1)),
        core: Number(core.toFixed(1)),
        overall: Number(overall.toFixed(1)),
    };
}

// ============================================
// SUBSCRIPTION MANAGEMENT FUNCTIONS
// ============================================

/**
 * Save or update subscription
 */
export async function saveSubscription(
    userId: string,
    subscriptionData: Partial<UserSubscription>
): Promise<void> {
    const userRef = db.collection('users').doc(userId);

    const dataToSave: Record<string, unknown> = {
        ...subscriptionData,
        updatedAt: Timestamp.now(),
    };

    if (subscriptionData.currentPeriodEnd) {
        dataToSave.currentPeriodEnd = Timestamp.fromDate(subscriptionData.currentPeriodEnd);
    }
    if (subscriptionData.trialEnd) {
        dataToSave.trialEnd = Timestamp.fromDate(subscriptionData.trialEnd);
    }

    await userRef.set({ subscription: dataToSave }, { merge: true });
    console.log("[firestore-admin] ✅ Subscription saved for user:", userId);
}

/**
 * Get subscription status
 */
export async function getSubscription(userId: string): Promise<UserSubscription> {
    const userRef = db.collection('users').doc(userId);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
        console.log(`[firestore-admin] Creating new user document for: ${userId}`);
        await userRef.set({
            createdAt: Timestamp.now(),
            subscription: { status: 'free' }
        });
        return { status: 'free' };
    }

    const data = snapshot.data();
    const sub = data?.subscription;

    if (!sub) {
        return { status: 'free' };
    }

    return {
        status: sub.status || 'free',
        stripeCustomerId: sub.stripeCustomerId,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        currentPeriodEnd: sub.currentPeriodEnd?.toDate?.() || undefined,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        trialEnd: sub.trialEnd?.toDate?.() || undefined,
    };
}

/**
 * Get monthly usage
 */
export async function getMonthlyUsage(userId: string): Promise<MonthlyUsage> {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usageRef = db.collection('users').doc(userId).collection('usage').doc(monthYear);
    const snapshot = await usageRef.get();

    if (!snapshot.exists) {
        return { scanCount: 0, monthYear };
    }

    const data = snapshot.data();
    return {
        scanCount: data?.scanCount || 0,
        monthYear,
    };
}

/**
 * Increment scan count
 */
export async function incrementScanCount(userId: string): Promise<number> {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usageRef = db.collection('users').doc(userId).collection('usage').doc(monthYear);

    await usageRef.set({
        scanCount: FieldValue.increment(1),
        monthYear,
        updatedAt: Timestamp.now(),
    }, { merge: true });

    const snapshot = await usageRef.get();
    return snapshot.data()?.scanCount || 1;
}

/**
 * Check if user can scan
 */
export async function canUserScan(userId: string): Promise<{
    canScan: boolean;
    scansRemaining: number;
    isPremium: boolean;
    reason?: string;
}> {
    const FREE_SCAN_LIMIT = 1;

    const subscription = await getSubscription(userId);
    const isPremium = subscription.status === 'active' || subscription.status === 'trialing';

    if (isPremium) {
        return { canScan: true, scansRemaining: -1, isPremium: true };
    }

    const usage = await getMonthlyUsage(userId);
    const scansRemaining = Math.max(0, FREE_SCAN_LIMIT - usage.scanCount);

    return {
        canScan: scansRemaining > 0,
        scansRemaining,
        isPremium: false,
        reason: scansRemaining === 0
            ? 'You\'ve used your free scan this month. Upgrade to Pro for unlimited scans!'
            : undefined,
    };
}

// CSV utilities (client-side only, kept for reference)
export function scanHistoryToCSV(scans: ScanRecord[]): string {
    const headers = ['Date', 'Time', 'Chest', 'Arms', 'Legs', 'Core', 'Overall', 'Weakness', 'Protocol'];
    const rows = scans.map((scan) => {
        const overall = ((scan.analysis.chest_density + scan.analysis.arms_density +
            scan.analysis.legs_density + scan.analysis.core_density) / 4).toFixed(1);
        return [
            scan.timestamp.toLocaleDateString(),
            scan.timestamp.toLocaleTimeString(),
            scan.analysis.chest_density.toFixed(1),
            scan.analysis.arms_density.toFixed(1),
            scan.analysis.legs_density.toFixed(1),
            scan.analysis.core_density.toFixed(1),
            overall,
            scan.analysis.primary_weakness || '',
            scan.recommendation?.protocol_name || '',
        ];
    });
    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
}

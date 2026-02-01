import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
    doc,
    getDoc,
} from 'firebase/firestore';

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

// Exercise Logging Types
export interface ExerciseLog {
    id?: string;
    userId: string;
    timestamp: Date;
    exerciseName: string;
    sets: string;
    reps: string;
    time?: string;
    actualDuration?: number; // In seconds
    focus: string;
    difficulty?: string;
    workoutId?: string;
}

// Subscription Types
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
    monthYear: string; // Format: "2024-02"
}

/**
 * Save a scan result to Firestore under the user's collection
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
    console.log("[firestore.ts] saveScanResult called");
    console.log("[firestore.ts] userId:", userId);
    console.log("[firestore.ts] scanData.status:", scanData.status);
    console.log("[firestore.ts] scanData.analysis exists:", !!scanData.analysis);

    if (!scanData.analysis) {
        console.error("[firestore.ts] ❌ No analysis data to save!");
        throw new Error('No analysis data to save');
    }

    console.log("[firestore.ts] Creating collection reference for path: users/" + userId + "/scans");
    const scansRef = collection(db, 'users', userId, 'scans');

    const docData = {
        userId,
        timestamp: Timestamp.now(),
        analysis: scanData.analysis,
        recommendation: scanData.recommendation || null,
        Details: scanData.Details || null,
    };

    console.log("[firestore.ts] Document data prepared:", {
        userId: docData.userId,
        timestamp: "Timestamp.now()",
        analysisKeys: Object.keys(docData.analysis),
        hasRecommendation: !!docData.recommendation,
        hasDetails: !!docData.Details
    });

    console.log("[firestore.ts] ⏳ Calling addDoc...");
    const docRef = await addDoc(scansRef, docData);
    console.log("[firestore.ts] ✅ addDoc completed, docRef.id:", docRef.id);

    return docRef.id;
}

/**
 * Save a completed exercise to Firestore
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
    const workoutsRef = collection(db, 'users', userId, 'workouts');

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

    const docRef = await addDoc(workoutsRef, docData);
    return docRef.id;
}

/**
 * Get exercise logs for a user
 */
export async function getExerciseLogs(
    userId: string,
    maxResults: number = 50
): Promise<ExerciseLog[]> {
    const workoutsRef = collection(db, 'users', userId, 'workouts');
    const q = query(workoutsRef, orderBy('timestamp', 'desc'), limit(maxResults));

    const snapshot = await getDocs(q);
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
 * Get scan history for a user, ordered by most recent first
 */
export async function getScanHistory(
    userId: string,
    maxResults: number = 50
): Promise<ScanRecord[]> {
    const scansRef = collection(db, 'users', userId, 'scans');
    const q = query(scansRef, orderBy('timestamp', 'desc'), limit(maxResults));

    const snapshot = await getDocs(q);
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
 * Get the most recent scan for a user
 */
export async function getLatestScan(userId: string): Promise<ScanRecord | null> {
    const scans = await getScanHistory(userId, 1);
    return scans.length > 0 ? scans[0] : null;
}

/**
 * Calculate the user's scan streak (consecutive days with at least one scan)
 */
export async function calculateStreak(userId: string): Promise<StreakData> {
    console.log("[streak] Calculating streak for user:", userId);

    // Get more history to cover gaps
    const scans = await getScanHistory(userId, 365);
    console.log(`[streak] Found ${scans.length} scans`);

    if (scans.length === 0) {
        return { current: 0, best: 0, lastScanDate: null };
    }

    // Helper to get local YYYY-MM-DD string
    const getLocalDateStr = (date: Date) => {
        return date.toLocaleDateString('en-CA'); // Returns "YYYY-MM-DD" in local time
    };

    // Get unique scan dates in LOCAL TIME
    const uniqueDates = new Set<string>();
    scans.forEach((scan) => {
        const dateStr = getLocalDateStr(scan.timestamp);
        uniqueDates.add(dateStr);
    });

    // Sort dates (newest first)
    const sortedDates = Array.from(uniqueDates).sort().reverse();
    console.log("[streak] Unique scan dates (local):", sortedDates);

    const today = new Date();
    const todayStr = getLocalDateStr(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    console.log(`[streak] Today: ${todayStr}, Yesterday: ${yesterdayStr}`);

    // Calculate Current Streak
    let currentStreak = 0;

    // Determine start point
    let checkDateStr = todayStr;
    if (sortedDates.includes(todayStr)) {
        console.log("[streak] Scanned today - streak is active");
        checkDateStr = todayStr;
    } else if (sortedDates.includes(yesterdayStr)) {
        console.log("[streak] Scanned yesterday - streak is active");
        checkDateStr = yesterdayStr;
    } else {
        console.log("[streak] No scan today or yesterday - streak broken");
        currentStreak = 0; // Streak broken
    }

    // Determine current streak length
    if (sortedDates.includes(checkDateStr)) {
        currentStreak = 1;
        let dateToCheck = new Date(checkDateStr);

        // Check days pending backwards
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
    console.log("[streak] Calculated current streak:", currentStreak);

    // Calculate Best Streak
    // We already have unique dates sorted descending (newest first). 
    // We can just iterate linearly to find the longest sequence.
    let bestStreak = 0;
    let tempStreak = 0;
    let expectedNextDate: Date | null = null;

    // Iterate from OLD to NEW for easier sequence tracking
    const sortedAsc = [...sortedDates].reverse();

    for (let i = 0; i < sortedAsc.length; i++) {
        const currentDateStr = sortedAsc[i];

        if (tempStreak === 0) {
            tempStreak = 1;
        } else {
            // Check if this date is 1 day after the previous expected one
            // Actually, we can just compare date objects
            const prevDateStr = sortedAsc[i - 1];

            const curr = new Date(currentDateStr);
            const prev = new Date(prevDateStr);

            // Diff in days
            const diffTime = Math.abs(curr.getTime() - prev.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                bestStreak = Math.max(bestStreak, tempStreak);
                tempStreak = 1;
            }
        }
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    // Ensure best streak is at least current streak (for edge cases)
    if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
    }

    console.log("[streak] Final Result - Current:", currentStreak, "Best:", bestStreak);

    const lastScanDate = scans.length > 0 ? scans[0].timestamp : null;

    return { current: currentStreak, best: bestStreak, lastScanDate };
}

/**
 * Calculate average densities across all scans for a user
 */
export async function getAverageDensities(
    userId: string
): Promise<AverageDensities> {
    const scans = await getScanHistory(userId);

    if (scans.length === 0) {
        return { chest: 0, arms: 0, legs: 0, core: 0, overall: 0 };
    }

    let totalChest = 0;
    let totalArms = 0;
    let totalLegs = 0;
    let totalCore = 0;

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

/**
 * Convert scan history to CSV format for download
 */
export function scanHistoryToCSV(scans: ScanRecord[]): string {
    const headers = [
        'Date',
        'Time',
        'Chest Density',
        'Arms Density',
        'Legs Density',
        'Core Density',
        'Overall',
        'Primary Weakness',
        'Protocol Name',
    ];

    const rows = scans.map((scan) => {
        const date = scan.timestamp.toLocaleDateString();
        const time = scan.timestamp.toLocaleTimeString();
        const overall = (
            (scan.analysis.chest_density +
                scan.analysis.arms_density +
                scan.analysis.legs_density +
                scan.analysis.core_density) /
            4
        ).toFixed(1);

        return [
            date,
            time,
            scan.analysis.chest_density.toFixed(1),
            scan.analysis.arms_density.toFixed(1),
            scan.analysis.legs_density.toFixed(1),
            scan.analysis.core_density.toFixed(1),
            overall,
            scan.analysis.primary_weakness || '',
            scan.recommendation?.protocol_name || '',
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
}

/**
 * Download CSV file in the browser
 */
export function downloadCSV(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// SUBSCRIPTION MANAGEMENT FUNCTIONS
// ============================================

/**
 * Save or update user subscription data
 */
export async function saveSubscription(
    userId: string,
    subscriptionData: Partial<UserSubscription>
): Promise<void> {
    const { setDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);

    // Convert Date objects to Timestamps
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

    await setDoc(userRef, { subscription: dataToSave }, { merge: true });
}

/**
 * Get user subscription status
 * If user doesn't exist in Firestore, create them with 'free' status
 */
export async function getSubscription(userId: string): Promise<UserSubscription> {
    const { setDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        // Create new user document with free status
        console.log(`[Firestore] Creating new user document for: ${userId}`);
        const newUserData = {
            createdAt: Timestamp.now(),
            subscription: {
                status: 'free',
            }
        };
        await setDoc(userRef, newUserData);
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
 * Get current month's usage for a user
 */
export async function getMonthlyUsage(userId: string): Promise<MonthlyUsage> {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usageRef = doc(db, 'users', userId, 'usage', monthYear);
    const snapshot = await getDoc(usageRef);

    if (!snapshot.exists()) {
        return { scanCount: 0, monthYear };
    }

    const data = snapshot.data();
    return {
        scanCount: data?.scanCount || 0,
        monthYear,
    };
}

/**
 * Increment scan count for the current month
 */
export async function incrementScanCount(userId: string): Promise<number> {
    const { setDoc, increment } = await import('firebase/firestore');

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usageRef = doc(db, 'users', userId, 'usage', monthYear);

    await setDoc(usageRef, {
        scanCount: increment(1),
        monthYear,
        updatedAt: Timestamp.now(),
    }, { merge: true });

    // Return the new count
    const snapshot = await getDoc(usageRef);
    return snapshot.data()?.scanCount || 1;
}

/**
 * Check if a user can perform a scan
 * Free users: 1 scan per month
 * Premium users: unlimited
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
        return {
            canScan: true,
            scansRemaining: -1, // Unlimited
            isPremium: true,
        };
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

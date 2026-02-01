"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import PremiumGate from "@/components/PremiumGate";

// Type definitions (previously from firestore)
interface ScanAnalysis {
    chest_density: number;
    arms_density: number;
    legs_density: number;
    core_density: number;
    primary_weakness?: string;
}

interface ScanRecommendation {
    protocol_name: string;
    focus_area: string;
    exercises: Array<{ name: string; reps: string; sets: string }>;
}

interface ScanRecord {
    id?: string;
    userId: string;
    timestamp: Date;
    analysis: ScanAnalysis;
    recommendation?: ScanRecommendation;
}

interface StreakData {
    current: number;
    best: number;
    lastScanDate: Date | null;
}

interface AverageDensities {
    chest: number;
    arms: number;
    legs: number;
    core: number;
    overall: number;
}

interface ExerciseLog {
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

// CSV utilities (client-side)
function scanHistoryToCSV(scans: ScanRecord[]): string {
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

function downloadCSV(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Timeline filter options
const TIME_FILTERS = [
    { id: "1W", label: "1W", days: 7 },
    { id: "1M", label: "1M", days: 30 },
    { id: "3M", label: "3M", days: 90 },
    { id: "6M", label: "6M", days: 180 },
    { id: "ALL", label: "All", days: 9999 },
];

export default function ProgressPage() {
    const { theme } = useTheme();
    const { user, isLoaded } = useUser();
    const isLight = theme === "light";

    const [activeFilter, setActiveFilter] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [workouts, setWorkouts] = useState<ExerciseLog[]>([]);
    const [filteredScans, setFilteredScans] = useState<ScanRecord[]>([]);
    const [streak, setStreak] = useState<StreakData>({ current: 0, best: 0, lastScanDate: null });
    const [averages, setAverages] = useState<AverageDensities>({ chest: 0, arms: 0, legs: 0, core: 0, overall: 0 });
    const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

    // Load data from API
    const loadData = useCallback(async () => {
        if (!user?.id) return;

        setIsLoading(true);
        try {
            // Fetch all data via API
            const [progressRes, workoutsRes] = await Promise.all([
                fetch('/api/scans?action=progress'),
                fetch('/api/workouts')
            ]);

            if (progressRes.ok) {
                const progressData = await progressRes.json();
                // Convert timestamp strings back to Date objects
                const parsedScans = (progressData.scans || []).map((scan: any) => ({
                    ...scan,
                    timestamp: new Date(scan.timestamp)
                }));
                setScans(parsedScans);
                setStreak(progressData.streak || { current: 0, best: 0, lastScanDate: null });
                setAverages(progressData.averages || { chest: 0, arms: 0, legs: 0, core: 0, overall: 0 });
            }

            if (workoutsRes.ok) {
                const workoutsData = await workoutsRes.json();
                const parsedWorkouts = (workoutsData.logs || []).map((w: any) => ({
                    ...w,
                    timestamp: new Date(w.timestamp)
                }));
                setWorkouts(parsedWorkouts);
            }
        } catch (error) {
            console.error("Error loading progress data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isLoaded && user?.id) {
            loadData();
        }
    }, [isLoaded, user?.id, loadData]);

    // Filter scans based on selected time period
    useEffect(() => {
        const filter = TIME_FILTERS.find((f) => f.id === activeFilter);
        if (!filter) return;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filter.days);

        const filtered = scans.filter((scan) => scan.timestamp >= cutoffDate);
        setFilteredScans(filtered);
    }, [scans, activeFilter]);

    // Handle CSV download
    const handleDownloadCSV = () => {
        if (scans.length === 0) return;
        const csv = scanHistoryToCSV(scans);
        const filename = `biogym-progress-${new Date().toISOString().split("T")[0]}.csv`;
        downloadCSV(filename, csv);
    };

    // Chart configuration
    const chartData = {
        labels: filteredScans
            .slice()
            .reverse()
            .map((scan) =>
                scan.timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            ),
        datasets: [
            {
                label: "Overall Density",
                data: filteredScans
                    .slice()
                    .reverse()
                    .map(
                        (scan) =>
                            (scan.analysis.chest_density +
                                scan.analysis.arms_density +
                                scan.analysis.legs_density +
                                scan.analysis.core_density) /
                            4
                    ),
                borderColor: "#D4FF00",
                backgroundColor: "rgba(212, 255, 0, 0.1)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#D4FF00",
                pointBorderColor: "#D4FF00",
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isLight ? "#fff" : "#1a1a1a",
                titleColor: isLight ? "#111" : "#fff",
                bodyColor: isLight ? "#666" : "#999",
                borderColor: isLight ? "#ddd" : "#333",
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `Score: ${Number(context.raw).toFixed(1)}/10`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: isLight ? "#f0f0f0" : "#2a2a2a" },
                ticks: { color: isLight ? "#666" : "#888" },
            },
            y: {
                min: 0,
                max: 10,
                grid: { color: isLight ? "#f0f0f0" : "#2a2a2a" },
                ticks: { color: isLight ? "#666" : "#888" },
            },
        },
    };

    // Pie chart for body fat distribution
    const pieData = {
        labels: ["Chest", "Arms", "Core", "Legs"],
        datasets: [
            {
                data: [averages.chest, averages.arms, averages.core, averages.legs],
                backgroundColor: ["#D4FF00", "#22d3ee", "#a855f7", "#f97316"],
                borderColor: isLight ? "#fff" : "#1a1a1a",
                borderWidth: 3,
            },
        ],
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: {
                    color: isLight ? "#666" : "#999",
                    padding: 16,
                    usePointStyle: true,
                },
            },
            tooltip: {
                backgroundColor: isLight ? "#fff" : "#1a1a1a",
                titleColor: isLight ? "#111" : "#fff",
                bodyColor: isLight ? "#666" : "#999",
                borderColor: isLight ? "#ddd" : "#333",
                borderWidth: 1,
                callbacks: {
                    label: (context: any) =>
                        `${context.label}: ${Number(context.raw).toFixed(1)}/10`,
                },
            },
        },
    };

    const hasData = scans.length > 0;
    const hasWorkouts = workouts.length > 0;

    // Loading state
    if (!isLoaded || isLoading) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <PremiumGate feature="Progress Analytics" description="Track your body composition over time, view detailed charts, and analyze your fitness journey with premium analytics.">
            <div className="max-w-6xl mx-auto space-y-6 pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className={`text-3xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                            Progress & Analytics
                        </h1>
                        <p className="text-gray-500">Track your physique transformation over time</p>
                    </div>

                    {/* Download Report Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownloadCSV}
                        disabled={!hasData}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${hasData
                            ? isLight
                                ? "bg-gray-900 text-white hover:bg-gray-800"
                                : "bg-[#D4FF00] text-black hover:bg-[#c4ef00]"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 3v9m0 0l-3-3m3 3l3-3M3 15h12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Download CSV Report
                    </motion.button>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
                >
                    {/* Streak Counter */}
                    <div
                        className={`col-span-2 sm:col-span-1 rounded-2xl border p-4 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <motion.span
                                animate={streak.current > 0 ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-2xl"
                            >
                                🔥
                            </motion.span>
                            <span className="text-xs text-gray-500">Current Streak</span>
                        </div>
                        <p className={`text-3xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                            {streak.current}
                            <span className="text-sm text-gray-500 ml-1">days</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Best: {streak.best} days</p>
                    </div>

                    {/* Total Scans */}
                    <div
                        className={`rounded-2xl border p-4 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">📸</span>
                            <span className="text-xs text-gray-500">Total Scans</span>
                        </div>
                        <p className={`text-2xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                            {scans.length}
                        </p>
                    </div>

                    {/* Average Densities */}
                    {[
                        { label: "Chest", value: averages.chest, icon: "🫁", color: "#D4FF00" },
                        { label: "Arms", value: averages.arms, icon: "💪", color: "#22d3ee" },
                        { label: "Core", value: averages.core, icon: "🎯", color: "#a855f7" },
                        { label: "Legs", value: averages.legs, icon: "🦵", color: "#f97316" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className={`rounded-2xl border p-4 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{stat.icon}</span>
                                <span className="text-xs text-gray-500">{stat.label}</span>
                            </div>
                            <p className={`text-2xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                {hasData ? stat.value.toFixed(1) : "--"}
                                <span className="text-sm text-gray-500">/10</span>
                            </p>
                        </div>
                    ))}
                </motion.div>

                {/* Timeline Filter */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-2"
                >
                    {TIME_FILTERS.map((filter) => (
                        <motion.button
                            key={filter.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeFilter === filter.id
                                ? "bg-[#D4FF00] text-black"
                                : isLight
                                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    : "bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]"
                                }`}
                        >
                            {filter.label}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Progress Line Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`lg:col-span-2 rounded-3xl border p-5 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                    Progress Over Time
                                </h3>
                                <p className="text-xs text-gray-500">Overall density trend (lower is better)</p>
                            </div>
                            {hasData && (
                                <div className="px-3 py-1 rounded-full bg-[#D4FF00]/20 border border-[#D4FF00]/40">
                                    <span className="text-xs text-[#D4FF00] font-medium">
                                        Avg: {averages.overall.toFixed(1)}/10
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="h-64 relative">
                            {hasData && filteredScans.length > 0 ? (
                                <Line data={chartData} options={chartOptions} />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-[#2a2a2a] rounded-2xl">
                                    <svg
                                        width="48"
                                        height="48"
                                        viewBox="0 0 48 48"
                                        fill="none"
                                        className="mb-3 text-gray-600"
                                    >
                                        <path
                                            d="M6 36l12-12 8 8 16-20"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <p className="text-gray-500 font-medium">No scan data yet</p>
                                    <p className="text-gray-600 text-xs">Complete scans to see your progress</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Body Fat Distribution Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className={`rounded-3xl border p-5 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                            }`}
                    >
                        <div className="mb-4">
                            <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                Density Distribution
                            </h3>
                            <p className="text-xs text-gray-500">Average by body region</p>
                        </div>
                        <div className="h-56 relative">
                            {hasData ? (
                                <Doughnut data={pieData} options={pieOptions} />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-[#2a2a2a] rounded-2xl">
                                    <span className="text-4xl mb-2">📊</span>
                                    <p className="text-gray-500 text-sm">No data available</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Workout History Log */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className={`rounded-3xl border p-6 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <span className="text-xl">🏋️‍♂️</span>
                                </div>
                                <div>
                                    <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                        Workout Log
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {workouts.length} exercises completed
                                    </p>
                                </div>
                            </div>
                        </div>

                        {hasWorkouts ? (
                            <div className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className={`border-b ${isLight ? "border-gray-100 text-gray-500" : "border-[#2a2a2a] text-gray-400"}`}>
                                                <th className="pb-3 text-xs font-medium uppercase tracking-wider pl-2">Date</th>
                                                <th className="pb-3 text-xs font-medium uppercase tracking-wider">Exercise</th>
                                                <th className="pb-3 text-xs font-medium uppercase tracking-wider">Duration</th>
                                                <th className="pb-3 text-xs font-medium uppercase tracking-wider">Sets x Reps</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {workouts.map((workout) => (
                                                <tr
                                                    key={workout.id}
                                                    className={`group transition-colors ${isLight ? "hover:bg-gray-50" : "hover:bg-[#1a1a1a]"}`}
                                                >
                                                    <td className="py-3 pl-2 text-xs text-gray-500 whitespace-nowrap">
                                                        {workout.timestamp.toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                        <span className="block text-[10px] opacity-70">
                                                            {workout.timestamp.toLocaleTimeString("en-US", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <p className={`text-sm font-medium ${isLight ? "text-gray-900" : "text-white"}`}>
                                                            {workout.exerciseName}
                                                        </p>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isLight ? "bg-gray-100 text-gray-600" : "bg-[#2a2a2a] text-gray-400"
                                                            }`}>
                                                            {workout.focus}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        {workout.actualDuration ? (
                                                            <span className={`text-sm font-mono font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                                                {Math.floor(workout.actualDuration / 60)}:{(workout.actualDuration % 60).toString().padStart(2, '0')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                {workout.time || "--"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-sm font-mono font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                                                {workout.sets}
                                                            </span>
                                                            <span className="text-xs text-gray-500">x</span>
                                                            <span className={`text-sm font-mono font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                                                {workout.reps}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[#2a2a2a] rounded-2xl">
                                <span className="text-4xl mb-2 opacity-50">📝</span>
                                <h4 className={`font-semibold mb-1 ${isLight ? "text-gray-900" : "text-white"}`}>
                                    No Workouts Logged
                                </h4>
                                <p className="text-gray-500 text-sm text-center max-w-xs">
                                    Check off exercises in the Training Lab to see your history here.
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Scan History Log */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={`rounded-3xl border p-6 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#D4FF00]/10 flex items-center justify-center">
                                    <span className="text-xl">📋</span>
                                </div>
                                <div>
                                    <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                        Scan History
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {scans.length} total scans recorded
                                    </p>
                                </div>
                            </div>
                        </div>

                        {hasData ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {scans.map((scan, index) => {
                                    const overall =
                                        (scan.analysis.chest_density +
                                            scan.analysis.arms_density +
                                            scan.analysis.legs_density +
                                            scan.analysis.core_density) /
                                        4;

                                    return (
                                        <motion.div
                                            key={scan.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() =>
                                                setSelectedScan(selectedScan?.id === scan.id ? null : scan)
                                            }
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedScan?.id === scan.id
                                                ? "border-[#D4FF00] bg-[#D4FF00]/5"
                                                : isLight
                                                    ? "border-gray-100 hover:border-gray-200 bg-gray-50"
                                                    : "border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#0f0f0f]"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${overall <= 4
                                                            ? "bg-green-500/20 text-green-400"
                                                            : overall <= 6
                                                                ? "bg-yellow-500/20 text-yellow-400"
                                                                : "bg-red-500/20 text-red-400"
                                                            }`}
                                                    >
                                                        <span className="text-lg font-bold">
                                                            {overall.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p
                                                            className={`font-medium ${isLight ? "text-gray-900" : "text-white"
                                                                }`}
                                                        >
                                                            {scan.timestamp.toLocaleDateString("en-US", {
                                                                weekday: "short",
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {scan.timestamp.toLocaleTimeString("en-US", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}{" "}
                                                            • Focus:{" "}
                                                            {scan.analysis.primary_weakness || "General"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="hidden sm:flex gap-2 text-xs">
                                                        <span className="px-2 py-1 rounded-full bg-[#D4FF00]/10 text-[#D4FF00]">
                                                            C: {scan.analysis.chest_density.toFixed(1)}
                                                        </span>
                                                        <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400">
                                                            A: {scan.analysis.arms_density.toFixed(1)}
                                                        </span>
                                                        <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
                                                            Co: {scan.analysis.core_density.toFixed(1)}
                                                        </span>
                                                        <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">
                                                            L: {scan.analysis.legs_density.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <svg
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 20 20"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        className={`transition-transform ${selectedScan?.id === scan.id ? "rotate-180" : ""
                                                            } text-gray-400`}
                                                    >
                                                        <path
                                                            d="M5 8l5 5 5-5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            <AnimatePresence>
                                                {selectedScan?.id === scan.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-4 pt-4 border-t border-[#2a2a2a]"
                                                    >
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                            {[
                                                                {
                                                                    label: "Chest",
                                                                    value: scan.analysis.chest_density,
                                                                    color: "#D4FF00",
                                                                },
                                                                {
                                                                    label: "Arms",
                                                                    value: scan.analysis.arms_density,
                                                                    color: "#22d3ee",
                                                                },
                                                                {
                                                                    label: "Core",
                                                                    value: scan.analysis.core_density,
                                                                    color: "#a855f7",
                                                                },
                                                                {
                                                                    label: "Legs",
                                                                    value: scan.analysis.legs_density,
                                                                    color: "#f97316",
                                                                },
                                                            ].map((stat) => (
                                                                <div
                                                                    key={stat.label}
                                                                    className={`p-3 rounded-xl ${isLight ? "bg-white" : "bg-[#1a1a1a]"
                                                                        }`}
                                                                >
                                                                    <p className="text-xs text-gray-500 mb-1">
                                                                        {stat.label}
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className="w-2 h-2 rounded-full"
                                                                            style={{ backgroundColor: stat.color }}
                                                                        />
                                                                        <span
                                                                            className={`font-bold ${isLight
                                                                                ? "text-gray-900"
                                                                                : "text-white"
                                                                                }`}
                                                                        >
                                                                            {stat.value.toFixed(1)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {scan.recommendation && (
                                                            <div className="mt-3 p-3 rounded-xl bg-[#D4FF00]/5 border border-[#D4FF00]/20">
                                                                <p className="text-xs text-[#D4FF00] font-medium">
                                                                    Protocol: {scan.recommendation.protocol_name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Focus: {scan.recommendation.focus_area}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[#2a2a2a] rounded-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-[#2a2a2a] flex items-center justify-center mb-4">
                                    <svg
                                        width="32"
                                        height="32"
                                        viewBox="0 0 32 32"
                                        fill="none"
                                        stroke="#6b7280"
                                        strokeWidth="2"
                                    >
                                        <rect x="4" y="6" width="24" height="20" rx="2" />
                                        <path d="M4 12h24M10 6v-2M22 6v-2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <h4 className={`font-semibold mb-1 ${isLight ? "text-gray-900" : "text-white"}`}>
                                    No Scan History
                                </h4>
                                <p className="text-gray-500 text-sm text-center max-w-xs">
                                    Complete your first scan to start tracking your progress. All analysis data is stored securely.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Privacy Notice */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className={`p-4 rounded-xl ${isLight ? "bg-gray-50" : "bg-[#0f0f0f]"}`}
                >
                    <div className="flex items-start gap-3">
                        <span className="text-lg">🛡️</span>
                        <div>
                            <p className={`text-sm font-medium ${isLight ? "text-gray-800" : "text-gray-200"}`}>
                                Your Privacy is Protected
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Only analysis metrics are stored. Your photos are never uploaded or saved to any server.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PremiumGate>
    );
}

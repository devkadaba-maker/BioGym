"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import HeatmapModel from "@/components/HeatmapModel";

interface Details {
    arms?: { left: string; right: string };
    chest?: string;
    core?: string;
    legs?: { left: string; right: string };
}

interface AnalysisResult {
    status?: string;
    analysis?: {
        chest_density: number;
        arms_density: number;
        legs_density: number;
        core_density: number;
        primary_focus_area?: string;
    };
    Details?: Details;
    [key: string]: unknown;
}

// Get score info based on density (LOWER = BETTER, meaning more defined muscles)
// Higher density = more adipose tissue = worse muscle definition
function getScoreInfo(value: number): { label: string; color: string; bgColor: string } {
    if (value <= 3) return { label: "Excellent", color: "#22d3ee", bgColor: "rgba(34, 211, 238, 0.15)" };
    if (value <= 5) return { label: "Good", color: "#4ade80", bgColor: "rgba(74, 222, 128, 0.15)" };
    if (value <= 7) return { label: "Moderate", color: "#fbbf24", bgColor: "rgba(251, 191, 36, 0.15)" };
    return { label: "Needs Work", color: "#ff3c3c", bgColor: "rgba(255, 60, 60, 0.15)" };
}

// Circular Progress Component with status label
function CircularProgress({ value, label, icon }: { value: number; label: string; icon: string }) {
    const scoreInfo = getScoreInfo(value);
    // Invert the percentage for visual (lower value = more filled = better)
    const invertedPercent = ((10 - value) / 10) * 100;
    const circumference = 2 * Math.PI * 36;
    const strokeDashoffset = circumference - (invertedPercent / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-2"
        >
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-[#2a2a2a]"
                    />
                    <motion.circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke={scoreInfo.color}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                            strokeDasharray: circumference,
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl">{icon}</span>
                    <span className="text-white font-bold text-sm">{value.toFixed(1)}</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-gray-300 text-xs font-medium">{label}</p>
                <p className="text-xs font-bold" style={{ color: scoreInfo.color }}>
                    {scoreInfo.label}
                </p>
            </div>
        </motion.div>
    );
}

export default function BioInsightsPage() {
    const { theme } = useTheme();
    const isLight = theme === "light";
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [activeDetail, setActiveDetail] = useState<string | null>(null);

    // Load result from sessionStorage on mount (clears when browser closes)
    useEffect(() => {
        sessionStorage.removeItem("isScanned");
        const savedResult = sessionStorage.getItem("scanlab-result");
        if (savedResult) {
            try {
                const parsed = JSON.parse(savedResult);
                console.log("Loaded scan result:", parsed);
                setAnalysisResult(parsed);
            } catch (e) {
                console.error("Failed to parse scan result:", e);
            }
        }
    }, []);

    if (!analysisResult) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl p-12 text-center border max-w-md ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}
                >
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isLight ? "bg-gray-200" : "bg-[#2a2a2a]"}`}>
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={isLight ? "#9ca3af" : "#6b7280"} strokeWidth="2">
                            <circle cx="20" cy="20" r="16" />
                            <path d="M20 12v8l5 3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2 className={`text-2xl font-bold mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
                        No Analysis Results
                    </h2>
                    <p className={`mb-6 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                        Complete a scan to see your physique insights here.
                    </p>
                    <Link
                        href="/dashboard/scan"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4FF00] text-black rounded-xl font-medium hover:bg-[#c4ef00] transition-all"
                    >
                        Go to Scan Lab
                    </Link>
                </motion.div>
            </div>
        );
    }

    const analysis = analysisResult.analysis;
    const details = analysisResult.Details;

    // Calculate overall score (lower is better)
    const overallScore = analysis
        ? ((analysis.chest_density + analysis.arms_density + analysis.core_density + analysis.legs_density) / 4)
        : 0;
    const overallInfo = getScoreInfo(overallScore);

    const detailItems = [
        { id: "chest", icon: "🫁", label: "Chest", text: details?.chest || "No analysis available" },
        { id: "arms", icon: "💪", label: "Arms", text: details?.arms ? `Left: ${details.arms.left}\nRight: ${details.arms.right}` : "No analysis available" },
        { id: "core", icon: "🎯", label: "Core", text: details?.core || "Central muscle group - Focus area for stability" },
        { id: "legs", icon: "🦵", label: "Legs", text: details?.legs ? `Left: ${details.legs.left}\nRight: ${details.legs.right}` : "No analysis available" },
    ];

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            {/* Main Content - Full Width Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">

                {/* LEFT SIDE - Heatmap (Full Height) */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-3xl border overflow-hidden flex flex-col ${isLight ? "bg-white border-gray-200" : "bg-[#0f0f0f] border-[#2a2a2a]"}`}
                >
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? "border-gray-100" : "border-[#2a2a2a]"}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                                <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Anatomical Heatmap</h3>
                                <p className="text-xs text-gray-500">Interactive density visualization</p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/scan"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] transition-all"
                        >
                            New Scan
                        </Link>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                        <HeatmapModel scanResult={analysisResult} />
                    </div>
                </motion.div>

                {/* RIGHT SIDE - Stacked Tiles */}
                <div className="flex flex-col gap-4">

                    {/* TOP RIGHT - Density Scores */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className={`rounded-3xl border flex-1 flex flex-col ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}
                    >
                        <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? "border-gray-100" : "border-[#2a2a2a]"}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📊</span>
                                <div>
                                    <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Density Scores</h3>
                                    <p className="text-xs text-gray-500">Lower = More Defined 💪</p>
                                </div>
                            </div>
                            {/* Overall Score Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.5 }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                                style={{ backgroundColor: overallInfo.bgColor, borderColor: `${overallInfo.color}40` }}
                            >
                                <span className="text-sm font-bold" style={{ color: overallInfo.color }}>
                                    {overallScore.toFixed(1)}
                                </span>
                                <span className="text-xs font-medium" style={{ color: overallInfo.color }}>
                                    {overallInfo.label}
                                </span>
                            </motion.div>
                        </div>

                        {/* Score Legend */}
                        <div className={`px-5 py-2 border-b text-xs flex items-center gap-4 ${isLight ? "border-gray-100 bg-gray-50" : "border-[#2a2a2a] bg-[#0f0f0f]"}`}>
                            <span className="text-gray-500">Score Guide:</span>
                            <span className="text-[#22d3ee]">● 1-3 Excellent</span>
                            <span className="text-[#4ade80]">● 4-5 Good</span>
                            <span className="text-[#fbbf24]">● 6-7 Moderate</span>
                            <span className="text-[#ff3c3c]">● 8-10 Needs Work</span>
                        </div>

                        <div className="flex-1 p-6 flex items-center justify-center">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <CircularProgress
                                    value={analysis?.chest_density ?? 0}
                                    label="Chest"
                                    icon="🫁"
                                />
                                <CircularProgress
                                    value={analysis?.arms_density ?? 0}
                                    label="Arms"
                                    icon="💪"
                                />
                                <CircularProgress
                                    value={analysis?.core_density ?? 0}
                                    label="Core"
                                    icon="🎯"
                                />
                                <CircularProgress
                                    value={analysis?.legs_density ?? 0}
                                    label="Legs"
                                    icon="🦵"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* BOTTOM RIGHT - Detailed Analysis */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={`rounded-3xl border flex-1 flex flex-col ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}
                    >
                        <div className={`px-5 py-4 border-b ${isLight ? "border-gray-100" : "border-[#2a2a2a]"}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🔍</span>
                                <div>
                                    <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Detailed Analysis</h3>
                                    <p className="text-xs text-gray-500">Click a region for insights</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col">
                            {/* Region Selector Tabs */}
                            <div className="flex gap-2 mb-4">
                                {detailItems.map((item, index) => (
                                    <motion.button
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + index * 0.1 }}
                                        onClick={() => setActiveDetail(activeDetail === item.id ? null : item.id)}
                                        className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeDetail === item.id
                                            ? "bg-[#D4FF00] text-black"
                                            : isLight
                                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                                            }`}
                                    >
                                        <span className="mr-1">{item.icon}</span>
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Detail Content */}
                            <div className={`flex-1 rounded-2xl p-4 ${isLight ? "bg-gray-50" : "bg-[#0f0f0f]"}`}>
                                <AnimatePresence mode="wait">
                                    {activeDetail ? (
                                        <motion.div
                                            key={activeDetail}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {detailItems.filter(item => item.id === activeDetail).map(item => (
                                                <div key={item.id}>
                                                    <h4 className={`font-bold text-lg mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
                                                        {item.icon} {item.label} Analysis
                                                    </h4>
                                                    <p className={`text-sm whitespace-pre-line ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                                                        {item.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center justify-center h-full text-gray-500 text-sm"
                                        >
                                            Select a body region above to see detailed analysis
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>

                    {/* START TRAINING BUTTON */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Link
                            href="/dashboard/training"
                            className="block w-full py-5 bg-[#D4FF00] hover:bg-[#c4ef00] text-black font-bold text-lg rounded-2xl text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,255,0,0.4)]"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Start Training
                            </span>
                        </Link>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import HeatmapModel from "@/components/HeatmapModel";

interface Hotspot {
    zone: string;
    coords: { x: number; y: number };
}

interface Details {
    arms?: { left: string; right: string };
    chest?: string;
    legs?: { left: string; right: string };
}

interface Recommendation {
    protocol_name?: string;
    exercises?: string[];
}

interface AnalysisResult {
    status?: string;
    analysis?: {
        hotspots?: Hotspot[];
        chest_density: number;
        arms_density: number;
        core_density: number;
        primary_focus_area?: string;
    };
    Details?: Details;
    recommendation?: Recommendation;
    [key: string]: unknown;
}

export default function BioInsightsPage() {
    const { theme } = useTheme();
    const isLight = theme === "light";
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [expandedTile, setExpandedTile] = useState<string | null>(null);

    // Load result from localStorage on mount
    useEffect(() => {
        const savedResult = localStorage.getItem("scanlab-result");
        if (savedResult) {
            try {
                setAnalysisResult(JSON.parse(savedResult));
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    if (!analysisResult) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className={`rounded-3xl p-12 text-center border ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}>
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
                        Upload and analyze an image in the Scan Lab to see your insights here.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4FF00] text-black rounded-xl font-medium hover:bg-[#c4ef00] transition-all"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 9H3M9 15l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Go to Scan Lab
                    </Link>
                </div>
            </div>
        );
    }

    const analysis = analysisResult.analysis;
    const details = analysisResult.Details;
    const recommendation = analysisResult.recommendation;

    const toggleTile = (tileId: string) => {
        setExpandedTile(expandedTile === tileId ? null : tileId);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className={`text-2xl font-bold mb-1 ${isLight ? "text-gray-900" : "text-white"}`}>
                        Physique Insights
                    </h2>
                    <p className={`text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                        Click on any tile to expand details
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${isLight ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-[#D4FF00] text-black hover:bg-[#c4ef00]"}`}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                    </svg>
                    New Scan
                </Link>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Tile 1: Heatmap (Top Left) */}
                <div
                    onClick={() => toggleTile('heatmap')}
                    className={`
                        rounded-3xl border cursor-pointer transition-all duration-300 overflow-hidden
                        ${expandedTile === 'heatmap' ? 'lg:col-span-2 lg:row-span-2' : ''}
                        ${isLight ? "bg-white border-gray-200 hover:border-gray-300" : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"}
                    `}
                >
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? "border-gray-100" : "border-[#2a2a2a]"}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                                <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Anatomical Heatmap</h3>
                                <p className={`text-xs ${isLight ? "text-gray-500" : "text-gray-500"}`}>Body density visualization</p>
                            </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${expandedTile === 'heatmap' ? 'rotate-180' : ''} ${isLight ? "bg-gray-100" : "bg-[#2a2a2a]"}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={isLight ? "#6b7280" : "#9ca3af"} strokeWidth="2">
                                <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div className={`p-4 ${expandedTile === 'heatmap' ? '' : 'max-h-[300px] overflow-hidden'}`}>
                        <div className={`${expandedTile === 'heatmap' ? '' : 'scale-[0.5] origin-top-left'} transition-transform`}>
                            <HeatmapModel scanResult={analysisResult} />
                        </div>
                    </div>
                </div>

                {/* Tile 2: Density Scores (Top Right) */}
                <div
                    onClick={() => toggleTile('density')}
                    className={`
                        rounded-3xl border cursor-pointer transition-all duration-300
                        ${expandedTile === 'density' ? 'lg:col-span-2' : ''}
                        ${isLight ? "bg-white border-gray-200 hover:border-gray-300" : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"}
                    `}
                >
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? "border-gray-100" : "border-[#2a2a2a]"}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📊</span>
                            <div>
                                <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Density Scores</h3>
                                <p className={`text-xs ${isLight ? "text-gray-500" : "text-gray-500"}`}>Muscle group analysis</p>
                            </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${expandedTile === 'density' ? 'rotate-180' : ''} ${isLight ? "bg-gray-100" : "bg-[#2a2a2a]"}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={isLight ? "#6b7280" : "#9ca3af"} strokeWidth="2">
                                <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="space-y-4">
                            {[
                                { label: "Chest", value: analysis?.chest_density || 0, icon: "🫁" },
                                { label: "Arms", value: analysis?.arms_density || 0, icon: "💪" },
                                { label: "Core", value: analysis?.core_density || 0, icon: "🎯" },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-sm font-medium ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                                            {item.icon} {item.label}
                                        </span>
                                        <span className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                            {item.value.toFixed(1)}/10
                                        </span>
                                    </div>
                                    <div className={`h-3 rounded-full overflow-hidden ${isLight ? "bg-gray-100" : "bg-[#2a2a2a]"}`}>
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(item.value / 10) * 100}%`,
                                                backgroundColor: item.value > 6.5 ? '#ff3c3c' : item.value > 4 ? '#d4ff00' : '#22d3ee'
                                            }}
                                        />
                                    </div>
                                    {expandedTile === 'density' && (
                                        <p className={`mt-2 text-xs ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                                            {item.label === "Chest" && details?.chest}
                                            {item.label === "Arms" && `Left: ${details?.arms?.left || 'N/A'} | Right: ${details?.arms?.right || 'N/A'}`}
                                            {item.label === "Core" && "Central stability and strength indicator"}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tile 3: Recommendations */}
                <div
                    onClick={() => toggleTile('recommendations')}
                    className={`
                        rounded-3xl border cursor-pointer transition-all duration-300
                        ${expandedTile === 'recommendations' ? 'lg:col-span-2' : ''}
                        ${isLight ? "bg-white border-gray-200 hover:border-gray-300" : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"}
                    `}
                >
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? "border-gray-100" : "border-[#2a2a2a]"}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🏋️</span>
                            <div>
                                <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Training Protocol</h3>
                                <p className={`text-xs ${isLight ? "text-gray-500" : "text-gray-500"}`}>{recommendation?.protocol_name || "Personalized plan"}</p>
                            </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${expandedTile === 'recommendations' ? 'rotate-180' : ''} ${isLight ? "bg-gray-100" : "bg-[#2a2a2a]"}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={isLight ? "#6b7280" : "#9ca3af"} strokeWidth="2">
                                <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="flex flex-wrap gap-2">
                            {(recommendation?.exercises || []).slice(0, expandedTile === 'recommendations' ? undefined : 3).map((exercise, i) => (
                                <span
                                    key={i}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isLight ? "bg-[#D4FF00]/20 text-gray-800" : "bg-[#D4FF00]/10 text-[#D4FF00]"}`}
                                >
                                    {exercise}
                                </span>
                            ))}
                            {!expandedTile && (recommendation?.exercises?.length || 0) > 3 && (
                                <span className={`px-3 py-1.5 rounded-lg text-sm ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                                    +{(recommendation?.exercises?.length || 0) - 3} more
                                </span>
                            )}
                        </div>
                        {expandedTile === 'recommendations' && (
                            <div className={`mt-4 pt-4 border-t ${isLight ? "border-gray-100" : "border-[#2a2a2a]"}`}>
                                <p className={`text-sm ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                                    Focus Area: <span className="font-semibold">{analysis?.primary_focus_area || "Overall Development"}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tile 4: Body Details */}
                <div
                    onClick={() => toggleTile('details')}
                    className={`
                        rounded-3xl border cursor-pointer transition-all duration-300
                        ${expandedTile === 'details' ? 'lg:col-span-2' : ''}
                        ${isLight ? "bg-white border-gray-200 hover:border-gray-300" : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"}
                    `}
                >
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? "border-gray-100" : "border-[#2a2a2a]"}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔍</span>
                            <div>
                                <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Detailed Analysis</h3>
                                <p className={`text-xs ${isLight ? "text-gray-500" : "text-gray-500"}`}>Region-by-region breakdown</p>
                            </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${expandedTile === 'details' ? 'rotate-180' : ''} ${isLight ? "bg-gray-100" : "bg-[#2a2a2a]"}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={isLight ? "#6b7280" : "#9ca3af"} strokeWidth="2">
                                <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className={`space-y-3 ${expandedTile !== 'details' ? 'line-clamp-3' : ''}`}>
                            {details?.chest && (
                                <div className={`p-3 rounded-xl ${isLight ? "bg-gray-50" : "bg-[#0f0f0f]"}`}>
                                    <p className={`text-xs font-semibold mb-1 ${isLight ? "text-gray-700" : "text-gray-300"}`}>🫁 Chest</p>
                                    <p className={`text-sm ${isLight ? "text-gray-600" : "text-gray-400"}`}>{details.chest}</p>
                                </div>
                            )}
                            {expandedTile === 'details' && (
                                <>
                                    {details?.arms && (
                                        <div className={`p-3 rounded-xl ${isLight ? "bg-gray-50" : "bg-[#0f0f0f]"}`}>
                                            <p className={`text-xs font-semibold mb-1 ${isLight ? "text-gray-700" : "text-gray-300"}`}>💪 Arms</p>
                                            <p className={`text-sm ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                                                <strong>Left:</strong> {details.arms.left}<br />
                                                <strong>Right:</strong> {details.arms.right}
                                            </p>
                                        </div>
                                    )}
                                    {details?.legs && (
                                        <div className={`p-3 rounded-xl ${isLight ? "bg-gray-50" : "bg-[#0f0f0f]"}`}>
                                            <p className={`text-xs font-semibold mb-1 ${isLight ? "text-gray-700" : "text-gray-300"}`}>🦵 Legs</p>
                                            <p className={`text-sm ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                                                <strong>Left:</strong> {details.legs.left}<br />
                                                <strong>Right:</strong> {details.legs.right}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {!expandedTile && (
                            <p className={`text-xs mt-2 ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                                Click to see full breakdown...
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

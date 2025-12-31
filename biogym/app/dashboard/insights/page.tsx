"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

export default function BioInsightsPage() {
    const { theme } = useTheme();
    const isLight = theme === "light";
    const [analysisResult, setAnalysisResult] = useState<object | null>(null);

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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-bold mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
                        Analysis Results
                    </h2>
                    <p className={isLight ? "text-gray-500" : "text-gray-400"}>
                        Raw JSON response from the AI analysis
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2))}
                        className={`
              px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2
              ${isLight ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"}
            `}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="4" y="4" width="8" height="8" rx="1" />
                            <path d="M2 10V3a1 1 0 011-1h7" />
                        </svg>
                        Copy JSON
                    </button>
                    <Link
                        href="/dashboard"
                        className={`
              px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2
              ${isLight ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-[#D4FF00] text-black hover:bg-[#c4ef00]"}
            `}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                        </svg>
                        New Scan
                    </Link>
                </div>
            </div>

            {/* Raw JSON Display */}
            <div className={`rounded-3xl overflow-hidden border ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}>
                <div className={`px-6 py-4 border-b flex items-center gap-3 ${isLight ? "border-gray-200" : "border-[#2a2a2a]"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? "bg-green-100" : "bg-green-500/20"}`}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22c55e" strokeWidth="2">
                            <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <h3 className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Raw JSON Response</h3>
                        <p className={`text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}>AI-generated physique analysis data</p>
                    </div>
                </div>
                <pre className={`p-6 overflow-x-auto text-sm font-mono max-h-[600px] overflow-y-auto ${isLight ? "text-gray-800 bg-gray-50" : "text-gray-300 bg-[#0f0f0f]"}`}>
                    {JSON.stringify(analysisResult, null, 2)}
                </pre>
            </div>

            {/* Quick Stats from JSON */}
            <div className="grid md:grid-cols-3 gap-4">
                {[
                    { icon: "📊", title: "Data Points", value: Object.keys(analysisResult).length.toString() },
                    { icon: "✅", title: "Status", value: "Complete" },
                    { icon: "🕐", title: "Timestamp", value: new Date().toLocaleTimeString() },
                ].map((item, i) => (
                    <div
                        key={i}
                        className={`p-5 rounded-2xl border transition-colors ${isLight
                            ? "bg-white border-gray-200"
                            : "bg-[#1a1a1a] border-[#2a2a2a]"
                            }`}
                    >
                        <span className="text-2xl mb-3 block">{item.icon}</span>
                        <h4 className={`font-semibold mb-1 ${isLight ? "text-gray-900" : "text-white"}`}>{item.title}</h4>
                        <p className={`text-lg font-bold ${isLight ? "text-gray-700" : "text-gray-300"}`}>{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

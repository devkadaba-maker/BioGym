"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisResult {
    analysis?: {
        chest_density: number;
        arms_density: number;
        legs_density: number;
        core_density: number;
        primary_focus_area?: string;
    };
    Details?: {
        arms?: { left: string; right: string };
        chest?: string;
        core?: string;
        legs?: { left: string; right: string };
    };
    [key: string]: unknown;
}

interface HeatmapModelProps {
    scanResult: AnalysisResult | null;
}

interface BodySection {
    id: string;
    label: string;
    x: number; // percentage from left
    y: number; // percentage from top
    width: number;
    height: number;
    densityKey: "chest_density" | "arms_density" | "core_density" | "legs_density";
    icon: string;
}

// Body section regions positioned over the anatomy image
const bodySections: BodySection[] = [
    { id: "chest", label: "Chest", x: 35, y: 22, width: 30, height: 12, densityKey: "chest_density", icon: "🫁" },
    { id: "left-arm", label: "Left Arm", x: 18, y: 24, width: 14, height: 20, densityKey: "arms_density", icon: "💪" },
    { id: "right-arm", label: "Right Arm", x: 68, y: 24, width: 14, height: 20, densityKey: "arms_density", icon: "💪" },
    { id: "core", label: "Core", x: 38, y: 35, width: 24, height: 15, densityKey: "core_density", icon: "🎯" },
    { id: "left-leg", label: "Left Leg", x: 32, y: 52, width: 16, height: 35, densityKey: "legs_density", icon: "🦵" },
    { id: "right-leg", label: "Right Leg", x: 52, y: 52, width: 16, height: 35, densityKey: "legs_density", icon: "🦵" },
];

// Get score info based on density
function getScoreInfo(value: number): { label: string; color: string; bgColor: string; recommendation: string } {
    if (value <= 3) return {
        label: "Excellent",
        color: "#22d3ee",
        bgColor: "rgba(34, 211, 238, 0.25)",
        recommendation: "Maintain current training intensity. Focus on progressive overload to continue improvements."
    };
    if (value <= 5) return {
        label: "Good",
        color: "#4ade80",
        bgColor: "rgba(74, 222, 128, 0.25)",
        recommendation: "Solid foundation. Add compound exercises for enhanced definition and strength gains."
    };
    if (value <= 7) return {
        label: "Moderate",
        color: "#fbbf24",
        bgColor: "rgba(251, 191, 36, 0.25)",
        recommendation: "Room for improvement. Increase training frequency and focus on mind-muscle connection."
    };
    return {
        label: "Needs Work",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.25)",
        recommendation: "Priority focus area. Dedicate extra sets and consider targeted isolation exercises."
    };
}

export default function HeatmapModel({ scanResult }: HeatmapModelProps) {
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);

    if (!scanResult?.analysis) {
        return (
            <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-gray-500">
                <div className="text-6xl mb-4">🔥</div>
                <p className="text-center text-sm">No analysis data available</p>
            </div>
        );
    }

    const analysis = scanResult.analysis;
    const details = scanResult.Details;
    const activeSection = selectedSection || hoveredSection;

    // Get active section data
    const getActiveSectionData = () => {
        if (!activeSection) return null;
        const section = bodySections.find(s => s.id === activeSection);
        if (!section) return null;

        const density = analysis[section.densityKey];
        const scoreInfo = getScoreInfo(density);

        // Get detailed text
        let detailText = "";
        if (section.id === "chest" && details?.chest) {
            detailText = details.chest;
        } else if ((section.id === "left-arm" || section.id === "right-arm") && details?.arms) {
            detailText = section.id === "left-arm" ? details.arms.left : details.arms.right;
        } else if (section.id === "core" && details?.core) {
            detailText = details.core;
        } else if ((section.id === "left-leg" || section.id === "right-leg") && details?.legs) {
            detailText = section.id === "left-leg" ? details.legs.left : details.legs.right;
        }

        return { section, density, scoreInfo, detailText };
    };

    const activeSectionData = getActiveSectionData();

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-4">
            {/* Anatomy Image with Interactive Regions */}
            <div className="relative flex-1 min-h-[400px] flex items-center justify-center">
                <div className="relative w-full max-w-[550px] aspect-[3/5]">
                    {/* Anatomy base image */}
                    <Image
                        src="/HumanAnatomy.png"
                        alt="Human Anatomy"
                        fill
                        className="object-contain"
                        priority
                    />

                    {/* Interactive body sections */}
                    {bodySections.map((section) => {
                        const density = analysis[section.densityKey];
                        const scoreInfo = getScoreInfo(density);
                        const isActive = activeSection === section.id;
                        const isPrimaryFocus = analysis.primary_focus_area?.toLowerCase().includes(section.id.replace("-", " ").split(" ")[0]);

                        return (
                            <motion.div
                                key={section.id}
                                className="absolute cursor-pointer rounded-xl transition-all duration-200"
                                style={{
                                    left: `${section.x}%`,
                                    top: `${section.y}%`,
                                    width: `${section.width}%`,
                                    height: `${section.height}%`,
                                    backgroundColor: isActive ? scoreInfo.bgColor : `${scoreInfo.color}15`,
                                    border: `2px solid ${isActive ? scoreInfo.color : `${scoreInfo.color}60`}`,
                                    boxShadow: isActive ? `0 0 20px ${scoreInfo.bgColor}` : `0 0 8px ${scoreInfo.color}30`,
                                }}
                                onMouseEnter={() => setHoveredSection(section.id)}
                                onMouseLeave={() => setHoveredSection(null)}
                                onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Section indicator dot */}
                                <div
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-200"
                                    style={{
                                        backgroundColor: scoreInfo.color,
                                        opacity: isActive ? 1 : 0.7,
                                        transform: `translate(-50%, -50%) scale(${isActive ? 1.5 : 1})`,
                                        boxShadow: `0 0 ${isActive ? 12 : 6}px ${scoreInfo.color}`,
                                    }}
                                />

                                {/* Priority focus badge */}
                                {isPrimaryFocus && (
                                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#D4FF00] rounded-full flex items-center justify-center text-xs">
                                        ⭐
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Hover instruction */}
                {!activeSection && (
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-gray-500 text-xs">Click or hover on body regions for details</p>
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            <AnimatePresence mode="wait">
                {activeSectionData ? (
                    <motion.div
                        key={activeSectionData.section.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="lg:w-64 p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a]"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                style={{ backgroundColor: activeSectionData.scoreInfo.bgColor }}
                            >
                                {activeSectionData.section.icon}
                            </div>
                            <div>
                                <h4 className="text-white font-bold">{activeSectionData.section.label}</h4>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: activeSectionData.scoreInfo.color }}
                                >
                                    {activeSectionData.scoreInfo.label}
                                </p>
                            </div>
                        </div>

                        {/* Density Score */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-xs uppercase tracking-wider">Density Score</span>
                                <span
                                    className="text-lg font-bold"
                                    style={{ color: activeSectionData.scoreInfo.color }}
                                >
                                    {activeSectionData.density.toFixed(1)}/10
                                </span>
                            </div>
                            <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(activeSectionData.density / 10) * 100}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: activeSectionData.scoreInfo.color }}
                                />
                            </div>
                            <p className="text-gray-500 text-xs mt-1">Lower = More Defined</p>
                        </div>

                        {/* Analysis Detail */}
                        {activeSectionData.detailText && (
                            <div className="mb-4 p-3 rounded-xl bg-[#0f0f0f]">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Analysis</p>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {activeSectionData.detailText}
                                </p>
                            </div>
                        )}

                        {/* Recommendation */}
                        <div className="p-3 rounded-xl bg-[#0f0f0f] border-l-2" style={{ borderColor: activeSectionData.scoreInfo.color }}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm">💡</span>
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Recommendation</p>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {activeSectionData.scoreInfo.recommendation}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:w-64 p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex flex-col items-center justify-center text-center"
                    >
                        <div className="text-4xl mb-3">👆</div>
                        <p className="text-gray-400 text-sm">Select a body region to view detailed analysis</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {bodySections.slice(0, 4).map((section) => {
                                const density = analysis[section.densityKey];
                                const scoreInfo = getScoreInfo(density);
                                return (
                                    <div
                                        key={section.id}
                                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                        style={{ backgroundColor: scoreInfo.bgColor }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: scoreInfo.color }}
                                        />
                                        <span style={{ color: scoreInfo.color }}>{section.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

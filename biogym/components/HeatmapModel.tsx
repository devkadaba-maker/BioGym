"use client";

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import HumanAnatomy from '@/public/HumanAnatomy.png';

interface Details {
    arms?: { left: string; right: string };
    chest?: string;
    legs?: { left: string; right: string };
}

interface AnalysisData {
    hotspots?: { zone: string; coords: { x: number; y: number }; description?: string }[];
    chest_density: number;
    arms_density: number;
    core_density: number;
}

interface HeatmapProps {
    scanResult: {
        analysis?: AnalysisData;
        Details?: Details;
    } | null;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 800;

// Define body regions with their coordinates and areas
const BODY_REGIONS = [
    {
        id: "chest",
        name: "Chest",
        path: [
            { x: 0.35, y: 0.18 },
            { x: 0.65, y: 0.18 },
            { x: 0.68, y: 0.32 },
            { x: 0.32, y: 0.32 },
        ],
        center: { x: 0.5, y: 0.24 },
        densityKey: "chest_density" as const
    },
    {
        id: "left_arm",
        name: "Left Arm",
        path: [
            { x: 0.68, y: 0.18 },
            { x: 0.82, y: 0.22 },
            { x: 0.88, y: 0.42 },
            { x: 0.72, y: 0.42 },
        ],
        center: { x: 0.78, y: 0.30 },
        densityKey: "arms_density" as const
    },
    {
        id: "right_arm",
        name: "Right Arm",
        path: [
            { x: 0.32, y: 0.18 },
            { x: 0.18, y: 0.22 },
            { x: 0.12, y: 0.42 },
            { x: 0.28, y: 0.42 },
        ],
        center: { x: 0.22, y: 0.30 },
        densityKey: "arms_density" as const
    },
    {
        id: "core",
        name: "Core / Abs",
        path: [
            { x: 0.38, y: 0.32 },
            { x: 0.62, y: 0.32 },
            { x: 0.60, y: 0.48 },
            { x: 0.40, y: 0.48 },
        ],
        center: { x: 0.5, y: 0.40 },
        densityKey: "core_density" as const
    },
    {
        id: "left_leg",
        name: "Left Leg",
        path: [
            { x: 0.52, y: 0.48 },
            { x: 0.62, y: 0.48 },
            { x: 0.65, y: 0.90 },
            { x: 0.52, y: 0.90 },
        ],
        center: { x: 0.58, y: 0.70 },
        densityKey: "core_density" as const
    },
    {
        id: "right_leg",
        name: "Right Leg",
        path: [
            { x: 0.48, y: 0.48 },
            { x: 0.38, y: 0.48 },
            { x: 0.35, y: 0.90 },
            { x: 0.48, y: 0.90 },
        ],
        center: { x: 0.42, y: 0.70 },
        densityKey: "core_density" as const
    },
];

// Default analysis for demo
const DEFAULT_ANALYSIS: AnalysisData = {
    hotspots: [],
    chest_density: 7,
    arms_density: 6,
    core_density: 5,
};

const DEFAULT_DETAILS: Details = {
    chest: "Good pectoral development with balanced upper and lower chest. Minor asymmetry detected.",
    arms: {
        left: "Strong bicep peak with good forearm vascularity. Tricep could use more development.",
        right: "Well-defined bicep with excellent muscle separation. Good overall arm proportion."
    },
    legs: {
        left: "Solid quad sweep with defined vastus lateralis. Hamstring development adequate.",
        right: "Good quadricep definition. Calf development above average."
    }
};

function getColorForDensity(density: number): { r: number; g: number; b: number } {
    const normalized = Math.min(1, Math.max(0, density / 10));
    if (normalized > 0.65) {
        return { r: 255, g: 60, b: 60 }; // High - Red
    } else if (normalized > 0.4) {
        return { r: 212, g: 255, b: 0 }; // Medium - Lime
    } else {
        return { r: 34, g: 211, b: 238 }; // Low - Cyan
    }
}

export default function HeatmapModel({ scanResult }: HeatmapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const analysis = scanResult?.analysis || DEFAULT_ANALYSIS;
    const details = scanResult?.Details || DEFAULT_DETAILS;

    // Get detail text for a region
    const getDetailForRegion = (regionId: string): { title: string; text: string; density: number } => {
        let text = "";
        let density = 5;
        let title = "";

        switch (regionId) {
            case "chest":
                title = "🫁 Chest Analysis";
                text = details.chest || "No detailed analysis available.";
                density = analysis.chest_density;
                break;
            case "left_arm":
                title = "💪 Left Arm Analysis";
                text = details.arms?.left || "No detailed analysis available.";
                density = analysis.arms_density;
                break;
            case "right_arm":
                title = "💪 Right Arm Analysis";
                text = details.arms?.right || "No detailed analysis available.";
                density = analysis.arms_density;
                break;
            case "core":
                title = "🎯 Core Analysis";
                text = "Central muscle group connecting upper and lower body. Focus area for stability.";
                density = analysis.core_density;
                break;
            case "left_leg":
                title = "🦵 Left Leg Analysis";
                text = details.legs?.left || "No detailed analysis available.";
                density = analysis.core_density;
                break;
            case "right_leg":
                title = "🦵 Right Leg Analysis";
                text = details.legs?.right || "No detailed analysis available.";
                density = analysis.core_density;
                break;
            default:
                title = "📊 Region Analysis";
                text = "Hover over a body region for details.";
        }

        return { title, text, density };
    };

    // Draw the heatmap
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw each body region with flowing gradients
        BODY_REGIONS.forEach((region) => {
            const density = analysis[region.densityKey] || 5;
            const color = getColorForDensity(density);
            const isHovered = hoveredRegion === region.id;

            // Convert normalized coords to pixels
            const path = region.path.map(p => ({
                x: p.x * CANVAS_WIDTH,
                y: p.y * CANVAS_HEIGHT
            }));
            const center = {
                x: region.center.x * CANVAS_WIDTH,
                y: region.center.y * CANVAS_HEIGHT
            };

            // Create the region shape
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.closePath();

            // Create radial gradient for heat effect
            const maxDist = Math.max(
                ...path.map(p => Math.hypot(p.x - center.x, p.y - center.y))
            );
            const gradient = ctx.createRadialGradient(
                center.x, center.y, 0,
                center.x, center.y, maxDist * 1.2
            );

            const opacity = isHovered ? 0.85 : 0.6;
            const innerOpacity = isHovered ? 0.95 : 0.75;

            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${innerOpacity})`);
            gradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.7})`);
            gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.4})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.fill();

            // Add glow effect for hovered regions
            if (isHovered) {
                ctx.save();
                ctx.shadowColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.shadowBlur = 30;
                ctx.fill();
                ctx.restore();
            }

            // Draw subtle outline
            ctx.strokeStyle = isHovered
                ? `rgba(255, 255, 255, 0.5)`
                : `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.stroke();

            // Draw center marker
            ctx.beginPath();
            ctx.arc(center.x, center.y, isHovered ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? '#ffffff' : `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;
            ctx.fill();

            // Inner bright core
            ctx.beginPath();
            ctx.arc(center.x, center.y, isHovered ? 4 : 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        });
    }, [analysis, hoveredRegion]);

    // Handle mouse movement
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Find which region the mouse is over
        let foundRegion: string | null = null;
        for (const region of BODY_REGIONS) {
            if (isPointInPolygon({ x, y }, region.path)) {
                foundRegion = region.id;
                break;
            }
        }

        setHoveredRegion(foundRegion);
        setTooltipPos({
            x: e.clientX - rect.left + 15,
            y: e.clientY - rect.top - 10
        });
    };

    const handleMouseLeave = () => {
        setHoveredRegion(null);
    };

    // Check if point is inside polygon
    function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            if (((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    const hoveredDetail = hoveredRegion ? getDetailForRegion(hoveredRegion) : null;

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Main Heatmap Container */}
            <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative p-6 bg-[#0a0a0a] rounded-3xl border border-[#2a2a2a] cursor-crosshair"
                style={{
                    filter: 'drop-shadow(0 0 40px rgba(212, 255, 0, 0.2))'
                }}
            >
                <div
                    className="relative"
                    style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                >
                    {/* Anatomy image */}
                    <Image
                        src={HumanAnatomy}
                        alt="Human Anatomy"
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className="absolute inset-0 object-contain"
                        style={{ opacity: 0.5 }}
                        priority
                    />

                    {/* Heatmap canvas */}
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className="absolute inset-0"
                        style={{ mixBlendMode: 'screen' }}
                    />
                </div>

                {/* Hover Tooltip */}
                {hoveredRegion && hoveredDetail && (
                    <div
                        className="absolute z-50 pointer-events-none"
                        style={{
                            left: Math.min(tooltipPos.x, CANVAS_WIDTH - 220),
                            top: tooltipPos.y
                        }}
                    >
                        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-2xl p-4 shadow-2xl min-w-[200px] max-w-[280px]">
                            <h4 className="text-white font-bold text-sm mb-2">
                                {hoveredDetail.title}
                            </h4>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="text-xs text-gray-500">Density:</div>
                                <div className="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${(hoveredDetail.density / 10) * 100}%`,
                                            backgroundColor: hoveredDetail.density > 6.5
                                                ? '#ff3c3c'
                                                : hoveredDetail.density > 4
                                                    ? '#d4ff00'
                                                    : '#22d3ee'
                                        }}
                                    />
                                </div>
                                <div className="text-xs font-bold text-white">
                                    {hoveredDetail.density.toFixed(1)}
                                </div>
                            </div>
                            <p className="text-gray-400 text-xs leading-relaxed">
                                {hoveredDetail.text}
                            </p>
                        </div>
                    </div>
                )}

                {/* Instruction hint */}
                {!hoveredRegion && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/90 px-4 py-2 rounded-full">
                        <p className="text-xs text-gray-400">
                            🖱️ Hover over body regions for detailed analysis
                        </p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                    <span className="text-xs text-gray-400">Low Density (1-4)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#d4ff00] shadow-[0_0_10px_rgba(212,255,0,0.8)]"></div>
                    <span className="text-xs text-gray-400">Optimal (4-6.5)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(255,60,60,0.8)]"></div>
                    <span className="text-xs text-gray-400">High Density (6.5+)</span>
                </div>
            </div>

            {/* Region Summary Cards */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                {[
                    { icon: "🫁", label: "Chest", density: analysis.chest_density },
                    { icon: "💪", label: "Arms", density: analysis.arms_density },
                    { icon: "🎯", label: "Core", density: analysis.core_density },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-center"
                    >
                        <span className="text-lg">{item.icon}</span>
                        <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                        <p className="text-lg font-bold text-white">{item.density.toFixed(1)}</p>
                    </div>
                ))}
            </div>

            <div className="text-sm text-gray-500 italic">
                {scanResult?.analysis ? 'AI Vision Analysis Complete' : '🔬 Demo Mode - Run a scan for real results'}
            </div>
        </div>
    );
}
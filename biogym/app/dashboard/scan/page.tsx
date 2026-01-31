"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CaptureStep {
    id: string;
    title: string;
    subtitle: string;
    instruction: string;
    warning?: string;
    requiredPhotos: number;
}

const CAPTURE_STEPS: CaptureStep[] = [
    {
        id: "physique",
        title: "Physique Capture",
        subtitle: "Torso Entry",
        instruction: "Align chest in center. Keep face ABOVE frame.",
        warning: "DANGER: KEEP FACE ABOVE THIS LINE",
        requiredPhotos: 1,
    },
    {
        id: "left-arm",
        title: "Arms Capture",
        subtitle: "Left Arm",
        instruction: "Position left arm fully extended in frame. Show bicep and tricep clearly.",
        requiredPhotos: 1,
    },
    {
        id: "right-arm",
        title: "Arms Capture",
        subtitle: "Right Arm",
        instruction: "Position right arm fully extended in frame. Show bicep and tricep clearly.",
        requiredPhotos: 1,
    },
    {
        id: "left-leg",
        title: "Legs Capture",
        subtitle: "Left Leg",
        instruction: "Position left leg fully extended in frame. Show quad and calf clearly.",
        requiredPhotos: 1,
    },
    {
        id: "right-leg",
        title: "Legs Capture",
        subtitle: "Right Leg",
        instruction: "Position right leg fully extended in frame. Show quad and calf clearly.",
        requiredPhotos: 1,
    },
];

export default function ScanLabPage() {
    const { theme } = useTheme();
    const isLight = theme === "light";
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(0);
    const [capturedImages, setCapturedImages] = useState<Record<string, string>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasCamera, setHasCamera] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const step = CAPTURE_STEPS[currentStep];
    const totalSteps = CAPTURE_STEPS.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;
    const hasCurrentImage = Boolean(capturedImages[step.id]);

    // Check for camera availability
    useEffect(() => {
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
            setHasCamera(true);
        }
    }, []);

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        setIsCameraLoading(true);
        setIsCameraReady(false);
        try {
            // Use back camera (environment) for physique capture
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            streamRef.current = stream;
            setIsCameraActive(true);

            if (videoRef.current) {
                const video = videoRef.current;
                video.srcObject = stream;

                // Function to mark camera as ready
                const markReady = () => {
                    setIsCameraReady(true);
                    setIsCameraLoading(false);
                };

                // Use canplay event - more reliable than loadedmetadata
                const handleCanPlay = () => {
                    video.removeEventListener('canplay', handleCanPlay);
                    markReady();
                };

                video.addEventListener('canplay', handleCanPlay);

                // Try to play immediately
                try {
                    await video.play();
                    // If play succeeds and video has dimensions, we're ready
                    if (video.videoWidth > 0) {
                        video.removeEventListener('canplay', handleCanPlay);
                        markReady();
                    }
                } catch {
                    // Autoplay blocked - still wait for canplay
                }

                // Fallback timeout - if nothing works in 3 seconds, show camera anyway
                setTimeout(() => {
                    if (!streamRef.current) return; // Camera was stopped
                    setIsCameraReady(true);
                    setIsCameraLoading(false);
                }, 3000);
            }
        } catch {
            setHasCamera(false);
            setIsCameraLoading(false);
            setIsCameraActive(false);
            fileInputRef.current?.click();
        }
    };

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
        setIsCameraReady(false);
        setIsCameraLoading(false);
    }, []);

    const captureFromCamera = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            setCapturedImages(prev => ({ ...prev, [step.id]: dataUrl }));
            toast.success("Photo captured!");
            stopCamera();
        }
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setCapturedImages(prev => ({ ...prev, [step.id]: result }));
            toast.success("Photo uploaded!");
        };
        reader.readAsDataURL(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
        e.target.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleNext = async () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // All images captured, analyze
            await analyzeImages();
        }
    };

    const analyzeImages = async () => {
        setIsAnalyzing(true);
        const toastId = toast.loading("Analyzing physique...");
        try {
            const formData = new FormData();
            let imageCount = 0;

            // Helper function to convert base64 to blob
            const base64ToBlob = (base64String: string): Blob => {
                const base64Data = base64String.split(",")[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray], { type: "image/jpeg" });
            };

            // Send ALL captured images with their region labels
            console.log("=== SCAN FRONTEND DEBUG ===");
            console.log("capturedImages keys:", Object.keys(capturedImages));

            for (const [regionId, imageData] of Object.entries(capturedImages)) {
                if (imageData) {
                    const blob = base64ToBlob(imageData);
                    formData.append(`image-${regionId}`, blob, `${regionId}.jpg`);
                    console.log(`Added image-${regionId}, size: ${blob.size} bytes`);
                    imageCount++;
                }
            }

            if (imageCount === 0) {
                throw new Error("No images captured");
            }

            console.log(`Sending ${imageCount} images for analysis`);
            console.log("=== FETCH START ===");

            const response = await fetch("/api/scan", {
                method: "POST",
                body: formData,
            });

            console.log("=== FETCH RESPONSE ===");
            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error body:", errorText);
                throw new Error(`Analysis failed: ${response.status}`);
            }

            const result = await response.json();
            console.log("=== API RESULT ===");
            console.log("Result status:", result.status);
            console.log("Has analysis:", !!result.analysis);
            console.log("Has scanId (from Firestore):", !!result.scanId);
            if (result.scanId) {
                console.log("✅ Firestore scanId:", result.scanId);
            }
            if (result.analysis) {
                console.log("Density scores:", {
                    chest: result.analysis.chest_density,
                    arms: result.analysis.arms_density,
                    legs: result.analysis.legs_density,
                    core: result.analysis.core_density
                });
            }

            sessionStorage.setItem("scanlab-result", JSON.stringify(result));
            sessionStorage.setItem("scanlab-images", JSON.stringify(capturedImages));
            sessionStorage.setItem("isScanned", "true");

            toast.dismiss(toastId);
            toast.success("Analysis complete!");
            router.push("/dashboard/insights");
        } catch (error) {
            console.error("=== ANALYSIS ERROR ===");
            console.error("Analysis error:", error);
            toast.dismiss(toastId);
            toast.error("Analysis failed. Please try again.");
            setIsAnalyzing(false);
        }
    };

    const retakePhoto = () => {
        setCapturedImages(prev => {
            const updated = { ...prev };
            delete updated[step.id];
            return updated;
        });
    };

    // Animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    };

    return (
        <div className="max-w-xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between mb-6"
            >
                <div>
                    <h1 className={`text-2xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                        {step.title}
                    </h1>
                    <p className={`text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                        {step.subtitle}
                    </p>
                </div>
                {/* Progress Indicator */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <motion.div
                            className="w-8 h-1 rounded-full bg-[#D4FF00]"
                            initial={{ width: 0 }}
                            animate={{ width: 32 }}
                        />
                        {Array.from({ length: totalSteps - 1 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className={`w-4 h-1 rounded-full transition-colors duration-300 ${i < currentStep ? "bg-[#D4FF00]" : isLight ? "bg-gray-200" : "bg-[#3a3a3a]"
                                    }`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                            />
                        ))}
                    </div>
                    <span className={`text-sm font-medium ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                        {currentStep + 1}/{totalSteps}
                    </span>
                </div>
            </motion.div>

            {/* Capture Area */}
            <AnimatePresence mode="wait" custom={1}>
                <motion.div
                    key={step.id}
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`relative rounded-3xl border overflow-hidden ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                        }`}
                    style={{ aspectRatio: "3/4", minHeight: 400 }}
                >
                    {/* Warning Badge */}
                    {step.warning && !hasCurrentImage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
                        >
                            <div className="px-4 py-2 bg-red-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold tracking-wider uppercase">
                                {step.warning}
                            </div>
                        </motion.div>
                    )}

                    {/* Captured Image Preview */}
                    {hasCurrentImage ? (
                        <div className="absolute inset-0 flex items-center justify-center p-6">
                            <div className="relative w-full h-full">
                                <img
                                    src={capturedImages[step.id]}
                                    alt="Captured"
                                    className="w-full h-full object-cover rounded-2xl"
                                />
                                <button
                                    onClick={retakePhoto}
                                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${isLight ? "bg-white/80 hover:bg-white" : "bg-black/50 hover:bg-black/70"
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round" />
                                    </svg>
                                </button>
                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center">
                                    <div className="px-4 py-2 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 8l4 4 6-8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Photo Captured
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : isCameraActive ? (
                        /* Camera View - Fullscreen on mobile */
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-full h-full">
                                {/* Loading overlay */}
                                {(isCameraLoading || !isCameraReady) && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 rounded-2xl">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-12 h-12 border-3 border-[#D4FF00]/30 border-t-[#D4FF00] rounded-full mb-4"
                                        />
                                        <p className="text-white/80 text-sm">Starting camera...</p>
                                    </div>
                                )}
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover rounded-2xl"
                                    style={{ transform: 'scaleX(1)' }}
                                />
                                {/* Capture Frame Guide - only show when ready */}
                                {isCameraReady && (
                                    <div className="absolute inset-4 md:inset-6 border-2 border-dashed border-[#D4FF00] rounded-2xl pointer-events-none scan-frame-pulse" />
                                )}
                                {/* Capture Buttons - larger for mobile */}
                                <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center gap-6">
                                    <button
                                        onClick={stopCamera}
                                        className={`p-4 md:p-4 rounded-full transition-all active:scale-95 ${isLight ? "bg-white/90" : "bg-[#2a2a2a]/90"}`}
                                    >
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={captureFromCamera}
                                        disabled={!isCameraReady}
                                        className={`p-5 md:p-4 rounded-full transition-all active:scale-95 ${isCameraReady
                                            ? "bg-[#D4FF00] text-black"
                                            : "bg-gray-500 text-gray-300 cursor-not-allowed"
                                            }`}
                                    >
                                        <svg width="32" height="32" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="14" cy="14" r="10" />
                                            <circle cx="14" cy="14" r="5" fill="currentColor" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Upload/Camera Selection with Drag & Drop */
                        <div
                            className="absolute inset-0 flex items-center justify-center p-6"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className={`relative w-full h-full flex flex-col items-center justify-center transition-all duration-200 ${isDragging ? 'scale-[1.02]' : ''}`}>
                                {/* Dashed Border Frame */}
                                <div className={`absolute inset-0 border-2 border-dashed rounded-3xl transition-all duration-200 ${isDragging
                                    ? 'border-[#D4FF00] bg-[#D4FF00]/10 border-4'
                                    : 'border-[#D4FF00] scan-frame-pulse'
                                    }`} />

                                {/* Drag Overlay */}
                                {isDragging && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-0 flex items-center justify-center z-20 rounded-3xl bg-[#D4FF00]/5 backdrop-blur-sm"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <motion.div
                                                animate={{ y: [0, -8, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            >
                                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#D4FF00" strokeWidth="2">
                                                    <path d="M24 32V16M16 22l8-8 8 8" strokeLinecap="round" strokeLinejoin="round" />
                                                    <rect x="8" y="36" width="32" height="4" rx="2" fill="#D4FF00" fillOpacity="0.3" />
                                                </svg>
                                            </motion.div>
                                            <p className="text-[#D4FF00] font-semibold text-lg">Drop image here</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Center Content */}
                                <div className={`relative z-10 flex flex-col items-center gap-4 transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'}`}>
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isLight ? "bg-gray-200" : "bg-[#2a2a2a]"
                                            }`}
                                    >
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#D4FF00" strokeWidth="2">
                                            <rect x="4" y="8" width="24" height="18" rx="3" />
                                            <circle cx="16" cy="17" r="5" />
                                            <path d="M10 8V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                                        </svg>
                                    </motion.div>

                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className={`text-center text-sm ${isLight ? "text-gray-600" : "text-gray-400"}`}
                                    >
                                        {hasCamera ? "Drag & drop, use camera, or upload" : "Drag & drop or upload a photo"}
                                    </motion.p>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex gap-3"
                                    >
                                        {hasCamera && (
                                            <button
                                                onClick={startCamera}
                                                className="px-5 py-2.5 bg-[#D4FF00] text-black rounded-xl font-medium hover:bg-[#c4ef00] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="4" width="14" height="10" rx="2" />
                                                    <circle cx="9" cy="9" r="3" />
                                                </svg>
                                                Camera
                                            </button>
                                        )}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${hasCamera
                                                ? isLight
                                                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                    : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                                                : "bg-[#D4FF00] text-black hover:bg-[#c4ef00]"
                                                }`}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 3v9M5 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M3 14h12" strokeLinecap="round" />
                                            </svg>
                                            Upload
                                        </button>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hidden Elements */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                </motion.div>
            </AnimatePresence>

            {/* Instruction Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`mt-4 px-5 py-4 rounded-2xl ${isLight ? "bg-gray-100 border border-gray-200" : "bg-[#1a1a1a] border border-[#2a2a2a]"
                    }`}
            >
                <p className={`text-center text-sm leading-relaxed ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                    &ldquo;{step.instruction}&rdquo;
                </p>
            </motion.div>

            {/* Action Button */}
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={handleNext}
                disabled={!hasCurrentImage || isAnalyzing}
                className={`
                    w-full mt-4 py-4 rounded-2xl font-semibold text-base transition-all duration-300
                    flex items-center justify-center gap-2
                    ${hasCurrentImage && !isAnalyzing
                        ? "bg-[#4a5568] text-white hover:bg-[#5a6578] cursor-pointer scan-button-glow"
                        : isLight
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
                    }
                `}
            >
                {isAnalyzing ? (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Analyzing...
                    </>
                ) : currentStep < totalSteps - 1 ? (
                    <>
                        Capture & Proceed
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 9h10M10 5l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </>
                ) : (
                    <>
                        Complete & Analyze
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l5 5 7-9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </>
                )}
            </motion.button>

            {/* Step Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6">
                {CAPTURE_STEPS.map((s, i) => (
                    <motion.div
                        key={s.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentStep
                            ? "w-6 bg-[#D4FF00]"
                            : capturedImages[s.id]
                                ? "bg-[#D4FF00]/50"
                                : isLight
                                    ? "bg-gray-300"
                                    : "bg-[#3a3a3a]"
                            }`}
                    />
                ))}
            </div>

            {/* Bottom Glow Effect */}
            {hasCurrentImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none"
                    style={{
                        background: "linear-gradient(to top, rgba(212, 255, 0, 0.15), transparent)",
                    }}
                />
            )}
        </div>
    );
}



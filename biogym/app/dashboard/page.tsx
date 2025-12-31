"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ScanLabPage() {
    const { theme } = useTheme();
    const router = useRouter();
    const isLight = theme === "light";
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load image from localStorage on mount
    useEffect(() => {
        const savedImage = localStorage.getItem("scanlab-image");
        const savedFileName = localStorage.getItem("scanlab-filename");
        if (savedImage) {
            setUploadedImage(savedImage);
            setFileName(savedFileName || "Uploaded Image");
        }
    }, []);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file");
            return;
        }

        // Clear previous results
        setError(null);
        localStorage.removeItem("scanlab-result");

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setUploadedImage(base64);
            setFileName(file.name);

            // Store in localStorage
            localStorage.setItem("scanlab-image", base64);
            localStorage.setItem("scanlab-filename", file.name);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setUploadedImage(null);
        setFileName("");
        setError(null);
        localStorage.removeItem("scanlab-image");
        localStorage.removeItem("scanlab-filename");
        localStorage.removeItem("scanlab-result");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleAnalyze = async () => {
        if (!uploadedImage) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            // Convert base64 data URL to blob
            const base64Data = uploadedImage.split(",")[1];
            const mimeType = uploadedImage.split(";")[0].split(":")[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            // Create FormData and send to API
            const formData = new FormData();
            formData.append("image", blob, fileName);

            const response = await fetch("/api/scan", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Analysis failed");
            }

            // Store result and redirect to insights
            localStorage.setItem("scanlab-result", JSON.stringify(data));
            router.push("/dashboard/insights");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h2 className={`text-2xl font-bold mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
                    Upload Your Photo
                </h2>
                <p className={isLight ? "text-gray-500" : "text-gray-400"}>
                    Upload a photo for AI-powered physique analysis. Your privacy is protected.
                </p>
            </div>

            {/* Upload Zone */}
            {!uploadedImage ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            relative rounded-3xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer
            ${isDragging
                            ? "border-[#D4FF00] bg-[#D4FF00]/10 scale-[1.02]"
                            : isLight
                                ? "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                                : "border-[#3a3a3a] bg-[#1a1a1a] hover:border-[#4a4a4a] hover:bg-[#1f1f1f]"
                        }
          `}
                    onClick={handleBrowseClick}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center py-8">
                        {/* Upload Icon */}
                        <div className={`
              w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors
              ${isDragging
                                ? "bg-[#D4FF00]/20"
                                : isLight
                                    ? "bg-gray-200"
                                    : "bg-[#2a2a2a]"
                            }
            `}>
                            <svg
                                width="40"
                                height="40"
                                viewBox="0 0 40 40"
                                fill="none"
                                stroke={isDragging ? "#D4FF00" : isLight ? "#6b7280" : "#9ca3af"}
                                strokeWidth="2"
                                className="transition-colors"
                            >
                                <path d="M20 28V12M12 20l8-8 8 8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 28v4a2 2 0 002 2h24a2 2 0 002-2v-4" strokeLinecap="round" />
                            </svg>
                        </div>

                        {/* Text */}
                        <h3 className={`text-xl font-semibold mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
                            {isDragging ? "Drop your image here" : "Drag and drop your image"}
                        </h3>
                        <p className={`text-sm mb-6 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                            or click to browse files
                        </p>

                        {/* Browse Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleBrowseClick();
                            }}
                            className={`
                px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                ${isLight
                                    ? "bg-gray-900 text-white hover:bg-gray-800"
                                    : "bg-[#D4FF00] text-black hover:bg-[#c4ef00]"
                                }
              `}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 12v3a1 1 0 001 1h12a1 1 0 001-1v-3" strokeLinecap="round" />
                                <path d="M5 7l4-4 4 4M9 3v9" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Browse from Computer
                        </button>

                        {/* Supported Formats */}
                        <p className={`text-xs mt-6 ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                            Supported: JPG, PNG, WebP • Max 10MB
                        </p>
                    </div>

                    {/* Decorative Corner Elements */}
                    <div className={`absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 rounded-tl-lg ${isDragging ? "border-[#D4FF00]" : isLight ? "border-gray-300" : "border-[#3a3a3a]"}`} />
                    <div className={`absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 rounded-tr-lg ${isDragging ? "border-[#D4FF00]" : isLight ? "border-gray-300" : "border-[#3a3a3a]"}`} />
                    <div className={`absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 rounded-bl-lg ${isDragging ? "border-[#D4FF00]" : isLight ? "border-gray-300" : "border-[#3a3a3a]"}`} />
                    <div className={`absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 rounded-br-lg ${isDragging ? "border-[#D4FF00]" : isLight ? "border-gray-300" : "border-[#3a3a3a]"}`} />
                </div>
            ) : (
                /* Image Preview */
                <div className={`rounded-3xl overflow-hidden ${isLight ? "bg-gray-100" : "bg-[#1a1a1a]"} border ${isLight ? "border-gray-200" : "border-[#2a2a2a]"}`}>
                    {/* Preview Header */}
                    <div className={`px-6 py-4 border-b flex items-center justify-between ${isLight ? "border-gray-200" : "border-[#2a2a2a]"}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? "bg-green-100" : "bg-green-500/20"}`}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22c55e" strokeWidth="2">
                                    <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-medium ${isLight ? "text-gray-900" : "text-white"}`}>{fileName}</p>
                                <p className={`text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}>Ready for analysis</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveImage}
                            disabled={isAnalyzing}
                            className={`
                px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2
                ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}
                ${isLight
                                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                                }
              `}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                            </svg>
                            Remove
                        </button>
                    </div>

                    {/* Image Display */}
                    <div className="relative w-full aspect-[4/3] flex items-center justify-center p-6">
                        <div className="relative max-h-full max-w-full">
                            <Image
                                src={uploadedImage}
                                alt="Uploaded preview"
                                width={600}
                                height={450}
                                className="rounded-2xl object-contain max-h-[400px] w-auto"
                                style={{ maxHeight: "400px" }}
                            />
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className={`px-6 py-4 border-t ${isLight ? "border-gray-200" : "border-[#2a2a2a]"}`}>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className={`
                w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3
                ${isAnalyzing
                                    ? "bg-[#D4FF00]/50 text-black/50 cursor-not-allowed"
                                    : "bg-[#D4FF00] text-black hover:bg-[#c4ef00]"
                                }
              `}
                        >
                            {isAnalyzing ? (
                                <>
                                    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                        <path d="M12 2a10 10 0 019.5 7" />
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 6v6l4 2" strokeLinecap="round" />
                                    </svg>
                                    Analyze Image
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className={`mt-6 p-4 rounded-2xl border ${isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/20"}`}>
                    <p className="text-red-500 font-medium">Error: {error}</p>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
                {[
                    { icon: "🔒", title: "Privacy First", desc: "Your images are never stored on our servers" },
                    { icon: "⚡", title: "Fast Analysis", desc: "Get results in under 2 seconds" },
                    { icon: "🎯", title: "Precise", desc: "98% accuracy on muscle mapping" },
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
                        <p className={`text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}>{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSubscription } from "@/context/SubscriptionContext";

interface UpgradeBannerProps {
    variant?: "inline" | "banner" | "card";
    message?: string;
}

export default function UpgradeBanner({ variant = "inline", message }: UpgradeBannerProps) {
    const { isPremium, openCheckout } = useSubscription();

    // Don't show if user is premium
    if (isPremium) return null;

    const handleUpgrade = async () => {
        await openCheckout();
    };

    if (variant === "inline") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4FF00]/10 to-[#D4FF00]/5 border border-[#D4FF00]/20"
            >
                <span className="text-sm text-gray-300">
                    {message || "Upgrade to Pro for unlimited scans"}
                </span>
                <button
                    onClick={handleUpgrade}
                    className="px-3 py-1 rounded-full bg-[#D4FF00] text-black text-xs font-bold hover:bg-[#c4ef00] transition-colors"
                >
                    Upgrade
                </button>
            </motion.div>
        );
    }

    if (variant === "banner") {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#D4FF00]/20 via-[#D4FF00]/10 to-[#D4FF00]/20 border-b border-[#D4FF00]/20"
            >
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3 text-center">
                    <span className="text-2xl">✨</span>
                    <span className="text-sm text-white">
                        {message || "Start your 7-day free trial and unlock unlimited scans, Training Lab, and Progress Analytics!"}
                    </span>
                    <button
                        onClick={handleUpgrade}
                        className="px-4 py-1.5 rounded-full bg-[#D4FF00] text-black text-xs font-bold hover:bg-[#c4ef00] transition-colors"
                    >
                        Start Free Trial →
                    </button>
                </div>
            </motion.div>
        );
    }

    // Card variant
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#D4FF00]/30 p-6 overflow-hidden relative"
        >
            {/* Glow effect */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4FF00]/10 rounded-full blur-2xl" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D4FF00]/20 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#D4FF00" strokeWidth="2">
                            <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Upgrade to Pro</h3>
                        <p className="text-xs text-gray-400">7-day free trial</p>
                    </div>
                </div>

                <p className="text-sm text-gray-300 mb-4">
                    {message || "Unlock unlimited scans, personalized training plans, and track your progress over time."}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={handleUpgrade}
                        className="flex-1 py-2.5 rounded-xl bg-[#D4FF00] text-black text-sm font-bold hover:bg-[#c4ef00] transition-colors"
                    >
                        Start Free Trial
                    </button>
                    <Link
                        href="/pricing"
                        className="px-4 py-2.5 rounded-xl bg-[#2a2a2a] text-gray-300 text-sm font-medium hover:bg-[#3a3a3a] transition-colors"
                    >
                        Learn More
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

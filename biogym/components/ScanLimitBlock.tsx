"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSubscription } from "@/context/SubscriptionContext";

interface ScanLimitBlockProps {
    isLight: boolean;
}

export default function ScanLimitBlock({ isLight }: ScanLimitBlockProps) {
    const { openCheckout } = useSubscription();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto"
        >
            <div className={`rounded-3xl border p-8 md:p-12 text-center relative overflow-hidden ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                }`}>
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF00]/5 via-transparent to-[#D4FF00]/5" />
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#D4FF00]/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isLight ? "bg-amber-100" : "bg-[#D4FF00]/10"
                        } border ${isLight ? "border-amber-200" : "border-[#D4FF00]/20"}`}>
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#D4FF00" strokeWidth="2">
                            <circle cx="20" cy="20" r="16" />
                            <path d="M20 12v10M20 26v2" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${isLight ? "text-gray-900" : "text-white"}`}>
                        Monthly Scan Limit Reached
                    </h2>

                    {/* Description */}
                    <p className={`mb-8 max-w-md mx-auto ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                        You've used your free scan for this month. Upgrade to Pro for <strong className="text-[#D4FF00]">unlimited scans</strong> and unlock your full potential!
                    </p>

                    {/* Benefits */}
                    <div className={`rounded-2xl p-6 mb-8 ${isLight ? "bg-gray-50" : "bg-[#0f0f0f]"}`}>
                        <p className={`text-sm mb-4 uppercase tracking-wider ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                            What you get with Pro:
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            {[
                                "Unlimited physique scans",
                                "Training Lab access",
                                "Progress Analytics",
                                "7-day free trial",
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-2 text-sm ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#D4FF00" strokeWidth="2">
                                        <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => openCheckout()}
                            className="flex-1 py-4 px-6 rounded-xl bg-[#D4FF00] text-black font-bold hover:bg-[#c4ef00] transition-all"
                        >
                            Start 7-Day Free Trial
                        </button>
                        <Link
                            href="/pricing"
                            className={`flex-1 py-4 px-6 rounded-xl font-medium text-center transition-all ${isLight ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                                }`}
                        >
                            View Pricing
                        </Link>
                    </div>

                    {/* Price note */}
                    <p className={`text-sm mt-6 ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                        Only <span className="text-[#D4FF00] font-bold">$6 AUD/month</span> after trial • Cancel anytime
                    </p>
                </div>
            </div>

            {/* Next scan info */}
            <div className={`mt-6 text-center text-sm ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                <p>Your free scan resets at the beginning of next month.</p>
            </div>
        </motion.div>
    );
}

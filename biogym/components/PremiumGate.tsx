"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSubscription } from "@/context/SubscriptionContext";

interface PremiumGateProps {
    children: React.ReactNode;
    feature: string;
    description?: string;
}

export default function PremiumGate({ children, feature, description }: PremiumGateProps) {
    const { isPremium, isLoading, openCheckout } = useSubscription();

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full"
                />
            </div>
        );
    }

    // If premium, show the actual content
    if (isPremium) {
        return <>{children}</>;
    }

    // Show upgrade prompt for non-premium users
    return (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg w-full rounded-3xl bg-[#1a1a1a] border border-[#2a2a2a] p-8 md:p-12 text-center relative overflow-hidden"
            >
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF00]/5 via-transparent to-[#D4FF00]/5" />
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#D4FF00]/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    {/* Lock Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center mx-auto mb-6">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#D4FF00" strokeWidth="2">
                            <rect x="8" y="18" width="24" height="18" rx="4" />
                            <path d="M12 18V12a8 8 0 1116 0v6" strokeLinecap="round" />
                            <circle cx="20" cy="27" r="2" fill="#D4FF00" />
                            <path d="M20 29v3" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        {feature} is a <span className="gradient-text">Pro Feature</span>
                    </h2>

                    {/* Description */}
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        {description || `Upgrade to BioGym.fit Pro to unlock ${feature} and take your training to the next level. Start with a 7-day free trial!`}
                    </p>

                    {/* Features preview */}
                    <div className="bg-[#0f0f0f] rounded-2xl p-6 mb-8">
                        <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider">What you'll get with Pro:</p>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            {[
                                "Unlimited scans",
                                "Training Lab",
                                "Progress Analytics",
                                "AI recommendations",
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
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
                            className="flex-1 py-4 px-6 rounded-xl bg-[#2a2a2a] text-gray-300 font-medium hover:bg-[#3a3a3a] transition-all"
                        >
                            View Pricing
                        </Link>
                    </div>

                    {/* Price note */}
                    <p className="text-sm text-gray-500 mt-6">
                        Only <span className="text-[#D4FF00] font-bold">$6 AUD/month</span> after trial • Cancel anytime
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

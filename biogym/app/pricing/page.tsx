"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSubscription } from "@/context/SubscriptionContext";
import { useUser } from "@clerk/nextjs";

export default function PricingPage() {
    const { user, isLoaded } = useUser();
    const { isPremium, isTrialing, openCheckout, openPortal, isLoading } = useSubscription();

    const handleUpgrade = async () => {
        if (!user) {
            // Redirect to sign in
            window.location.href = '/sign-in';
            return;
        }
        await openCheckout();
    };

    const handleManage = async () => {
        await openPortal();
    };

    return (
        <main className="min-h-screen bg-[#0f0f0f] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF00]/5 via-transparent to-[#D4FF00]/5" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4FF00]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4FF00]/5 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/20 mb-6">
                        <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
                        <span className="text-sm text-[#D4FF00] font-medium">Simple Pricing</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                        Unlock Your <span className="gradient-text italic">Full Potential</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Start with a 7-day free trial. Cancel anytime.
                        Transform your physique with AI-powered insights.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative rounded-3xl bg-[#1a1a1a] border border-[#2a2a2a] p-8"
                    >
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                            <p className="text-gray-400">Get started with basic features</p>
                        </div>

                        <div className="mb-8">
                            <span className="text-5xl font-bold text-white">$0</span>
                            <span className="text-gray-400">/month</span>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-gray-300">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#D4FF00" strokeWidth="2">
                                        <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                1 physique scan per month
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#D4FF00" strokeWidth="2">
                                        <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                Basic Bio-Insights
                            </li>
                            <li className="flex items-center gap-3 text-gray-500">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="2">
                                        <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                                    </svg>
                                </span>
                                <span className="line-through">Training Lab</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-500">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="2">
                                        <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                                    </svg>
                                </span>
                                <span className="line-through">Progress Analytics</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-500">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="2">
                                        <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                                    </svg>
                                </span>
                                <span className="line-through">Unlimited scans</span>
                            </li>
                        </ul>

                        <Link
                            href="/dashboard/scan"
                            className="block w-full py-4 px-6 rounded-xl bg-[#2a2a2a] text-white font-medium text-center hover:bg-[#3a3a3a] transition-all"
                        >
                            Get Started Free
                        </Link>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-2 border-[#D4FF00] p-8 overflow-hidden"
                    >
                        {/* Popular Badge */}
                        <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-[#D4FF00] text-black text-xs font-bold uppercase">
                            Most Popular
                        </div>

                        {/* Glow Effect */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#D4FF00]/20 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                                <p className="text-gray-400">Everything you need to transform</p>
                            </div>

                            <div className="mb-2">
                                <span className="text-5xl font-bold text-white">$6</span>
                                <span className="text-gray-400"> AUD/month</span>
                            </div>
                            <p className="text-sm text-[#D4FF00] mb-8">7-day free trial • Cancel anytime</p>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4FF00]/20 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#D4FF00" strokeWidth="2">
                                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <strong>Unlimited</strong> physique scans
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4FF00]/20 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#D4FF00" strokeWidth="2">
                                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    Advanced Bio-Insights
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4FF00]/20 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#D4FF00" strokeWidth="2">
                                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <strong>Training Lab</strong> access
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4FF00]/20 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#D4FF00" strokeWidth="2">
                                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <strong>Progress Analytics</strong> & history
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4FF00]/20 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#D4FF00" strokeWidth="2">
                                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    AI exercise recommendations
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4FF00]/20 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#D4FF00" strokeWidth="2">
                                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    Priority support
                                </li>
                            </ul>

                            {isLoaded && isLoading ? (
                                <div className="w-full py-4 px-6 rounded-xl bg-[#D4FF00]/50 text-black/50 font-bold text-center">
                                    Loading...
                                </div>
                            ) : isPremium || isTrialing ? (
                                <button
                                    onClick={handleManage}
                                    className="w-full py-4 px-6 rounded-xl bg-[#D4FF00] text-black font-bold text-center hover:bg-[#c4ef00] transition-all flex items-center justify-center gap-2"
                                >
                                    {isTrialing && <span className="text-xs px-2 py-0.5 rounded bg-black/20">Trial Active</span>}
                                    Manage Subscription
                                </button>
                            ) : (
                                <button
                                    onClick={handleUpgrade}
                                    className="w-full py-4 px-6 rounded-xl bg-[#D4FF00] text-black font-bold text-center hover:bg-[#c4ef00] transition-all group"
                                >
                                    Start Free Trial
                                    <svg className="inline-block ml-2 group-hover:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-24 max-w-3xl mx-auto"
                >
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        Frequently Asked <span className="gradient-text italic">Questions</span>
                    </h2>

                    <div className="space-y-6">
                        {[
                            {
                                q: "How does the 7-day free trial work?",
                                a: "When you sign up for Pro, you get full access to all features for 7 days completely free. You won't be charged until the trial ends, and you can cancel anytime before that."
                            },
                            {
                                q: "Can I cancel my subscription anytime?",
                                a: "Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
                            },
                            {
                                q: "What payment methods do you accept?",
                                a: "We accept all major credit and debit cards through our secure payment processor, Stripe. Your payment information is encrypted and never stored on our servers."
                            },
                            {
                                q: "Is my physique data private?",
                                a: "Absolutely. Your photos are processed in real-time and never stored on our servers. Only the analysis metrics are saved, and these are encrypted and only accessible by you."
                            }
                        ].map((faq, i) => (
                            <div
                                key={i}
                                className="rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] p-6"
                            >
                                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                                <p className="text-gray-400">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-24 text-center"
                >
                    <p className="text-gray-400 mb-4">
                        Still have questions?
                    </p>
                    <Link
                        href="/#contact"
                        className="inline-flex items-center gap-2 text-[#D4FF00] font-medium hover:underline"
                    >
                        Contact us
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 8h8M8 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}

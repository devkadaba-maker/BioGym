"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

interface CTAButtonsProps {
    variant?: "hero" | "section";
}

export default function CTAButtons({ variant = "hero" }: CTAButtonsProps) {
    const isHero = variant === "hero";

    return (
        <>
            <SignedOut>
                {/* Not logged in - go to sign up */}
                <Link
                    href="/sign-up"
                    className={
                        isHero
                            ? "btn-primary animate-slide-up-delay-3"
                            : "btn-primary text-lg px-10 py-4"
                    }
                >
                    Start for Free
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                            d="M5 15L15 5M15 5H8M15 5V12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </Link>
            </SignedOut>
            <SignedIn>
                {/* Logged in - go to dashboard */}
                <Link
                    href="/dashboard"
                    className={
                        isHero
                            ? "btn-primary animate-slide-up-delay-3"
                            : "btn-primary text-lg px-10 py-4"
                    }
                >
                    Go to Dashboard
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                            d="M5 15L15 5M15 5H8M15 5V12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </Link>
            </SignedIn>
        </>
    );
}

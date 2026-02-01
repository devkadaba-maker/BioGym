"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton,
} from "@clerk/nextjs";

export default function Navbar() {
    const pathname = usePathname();

    // Hide navbar on auth pages and dashboard (dashboard has its own layout)
    if (
        pathname?.startsWith("/sign-in") ||
        pathname?.startsWith("/sign-up") ||
        pathname?.startsWith("/dashboard")
    ) {
        return null;
    }

    // Determine which nav links to show based on current page
    const isLandingPage = pathname === "/";
    const isDashboard = pathname?.startsWith("/dashboard");

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 glass">
            <nav className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 text-white">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M8 12H24M8 20H24M12 8V24M20 8V24"
                            stroke="#D4FF00"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="text-xl font-bold">BioGym.fit</span>
                </Link>

                {/* Nav Links - Dynamic based on page */}
                <div className="hidden md:flex items-center gap-8">
                    {isLandingPage ? (
                        // Landing page: Product, Pricing & Contact anchor links
                        <>
                            <Link
                                href="#features"
                                className="text-gray-300 hover:text-white transition-colors text-sm"
                            >
                                Product
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-gray-300 hover:text-white transition-colors text-sm"
                            >
                                Pricing
                            </Link>
                            <Link
                                href="#contact"
                                className="text-gray-300 hover:text-white transition-colors text-sm"
                            >
                                Contact
                            </Link>
                        </>
                    ) : isDashboard ? (
                        // Dashboard: Overview, Scan, History tabs
                        <div className="hidden">
                            <Link
                                href="/dashboard"
                                className={`text-sm transition-colors ${pathname === "/dashboard"
                                    ? "text-[#D4FF00]"
                                    : "text-gray-300 hover:text-white"
                                    }`}
                            >
                                Overview
                            </Link>
                            <Link
                                href="/dashboard/scan"
                                className={`text-sm transition-colors ${pathname === "/dashboard/scan"
                                    ? "text-[#D4FF00]"
                                    : "text-gray-300 hover:text-white"
                                    }`}
                            >
                                Scan
                            </Link>
                            <Link
                                href="/dashboard/history"
                                className={`text-sm transition-colors ${pathname === "/dashboard/history"
                                    ? "text-[#D4FF00]"
                                    : "text-gray-300 hover:text-white"
                                    }`}
                            >
                                History
                            </Link>
                        </div>
                    ) : (
                        // Other pages: Home & Dashboard links
                        <>
                            <Link
                                href="/"
                                className="text-gray-300 hover:text-white transition-colors text-sm"
                            >
                                Home
                            </Link>
                            <SignedIn>
                                <Link
                                    href="/dashboard"
                                    className="text-gray-300 hover:text-white transition-colors text-sm"
                                >
                                    Dashboard
                                </Link>
                            </SignedIn>
                        </>
                    )}
                </div>

                {/* Auth Buttons - Dynamic based on page and auth state */}
                <div className="flex items-center gap-4">
                    <SignedOut>
                        {/* Not logged in */}
                        {isLandingPage ? (
                            // Landing page: Sign in + Get Started
                            <>
                                <SignInButton mode="modal">
                                    <button className="btn-secondary hidden sm:flex">Sign in</button>
                                </SignInButton>
                                <Link href="/sign-up" className="btn-primary hidden sm:flex">
                                    Get Started
                                </Link>
                            </>
                        ) : (
                            // Other pages: Just Sign in
                            <SignInButton mode="redirect" forceRedirectUrl={pathname}>
                                <button className="btn-primary hidden sm:flex">Sign in</button>
                            </SignInButton>
                        )}
                    </SignedOut>

                    <SignedIn>
                        {/* Logged in */}
                        {!isDashboard && (
                            // Show Dashboard button only when NOT on dashboard
                            <Link
                                href="/dashboard"
                                className="btn-primary hidden sm:flex text-sm"
                            >
                                Dashboard
                            </Link>
                        )}
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10 border-2 border-[#D4FF00]/30",
                                    userButtonPopoverCard: "bg-[#252525] border border-[#333]",
                                    userButtonPopoverActionButton:
                                        "text-gray-300 hover:text-white hover:bg-[#333]",
                                    userButtonPopoverActionButtonText: "text-gray-300",
                                    userButtonPopoverActionButtonIcon: "text-gray-400",
                                    userButtonPopoverFooter: "hidden",
                                },
                            }}
                            afterSignOutUrl="/"
                        />
                    </SignedIn>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-white p-2">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M3 12H21M3 6H21M3 18H21" />
                        </svg>
                    </button>
                </div>
            </nav>
        </header>
    );
}

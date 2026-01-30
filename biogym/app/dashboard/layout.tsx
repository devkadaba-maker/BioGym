"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Searchable items
    const searchableItems = [
        { label: "Scan Lab", href: "/dashboard/scan", keywords: ["scan", "upload", "photo", "analysis"] },
        { label: "Bio-Insights", href: "/dashboard/insights", keywords: ["insights", "metrics", "density", "score"] },
        { label: "Training Lab", href: "/dashboard/training", keywords: ["training", "workout", "exercise", "routine"] },
        { label: "Progress", href: "/dashboard/progress", keywords: ["progress", "analytics", "history", "charts", "milestones"] },
    ];

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = searchableItems
                .filter(
                    (item) =>
                        item.label.toLowerCase().includes(query.toLowerCase()) ||
                        item.keywords.some((k) => k.includes(query.toLowerCase()))
                )
                .map((item) => item.label);
            setSearchResults(results);
            setShowResults(true);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const handleSearchSubmit = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && searchResults.length > 0) {
            const match = searchableItems.find((item) => item.label === searchResults[0]);
            if (match) {
                router.push(match.href);
                setSearchQuery("");
                setShowResults(false);
            }
        }
    };

    const navItems = [
        {
            name: "Scan Lab",
            href: "/dashboard/scan",
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="10" cy="10" r="8" />
                    <path d="M10 4v12M4 10h12" />
                </svg>
            ),
        },
        {
            name: "Bio-Insights",
            href: "/dashboard/insights",
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 16L6 10L10 13L14 6L18 9" />
                    <circle cx="18" cy="9" r="2" />
                </svg>
            ),
        },
        {
            name: "Training Lab",
            href: "/dashboard/training",
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="8" width="4" height="8" rx="1" />
                    <rect x="8" y="4" width="4" height="12" rx="1" />
                    <rect x="14" y="6" width="4" height="10" rx="1" />
                </svg>
            ),
        },
        {
            name: "Progress",
            href: "/dashboard/progress",
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 18L8 12L12 16L18 6" />
                    <path d="M14 6H18V10" />
                </svg>
            ),
        },
    ];

    const isLight = theme === "light";

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isLight ? "bg-[#f5f5f5]" : "bg-[#0f0f0f]"}`}>
            {/* Sidebar (Desktop Only) */}
            <aside className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-60 flex-col z-40 border-r transition-colors duration-300 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                }`}>
                {/* Logo */}
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? "bg-gray-100" : "bg-[#2a2a2a]"}`}>
                            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                                <path d="M8 12H24M8 20H24M12 8V24M20 8V24" stroke="#D4FF00" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className={`text-xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>BioGym</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? isLight
                                        ? "bg-gray-100 text-gray-900"
                                        : "bg-[#2a2a2a] text-white"
                                    : isLight
                                        ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                        : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]/50"
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Icons */}
                <div className="p-4 space-y-2">
                    {/* Support */}
                    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isLight ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]/50"
                        }`}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="10" cy="10" r="8" />
                            <path d="M7 8c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5-1.5 2-3 2v1.5" />
                            <circle cx="10" cy="14" r="0.5" fill="currentColor" />
                        </svg>
                        <span className="font-medium">Support</span>
                    </button>

                    {/* Theme Toggle */}
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${isLight ? "bg-gray-100" : "bg-[#2a2a2a]"}`}>
                        {/* Moon Icon */}
                        <button
                            onClick={() => theme === "light" && toggleTheme()}
                            className={`p-2 rounded-lg transition-all ${!isLight ? "bg-[#3a3a3a] text-white" : "text-gray-400"}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M6 1a7 7 0 107 9.4A5 5 0 016.6 1H6z" />
                            </svg>
                        </button>
                        {/* Sun Icon */}
                        <button
                            onClick={() => theme === "dark" && toggleTheme()}
                            className={`p-2 rounded-lg transition-all ${isLight ? "bg-white text-yellow-500 shadow-sm" : "text-gray-400"}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="8" cy="8" r="3" />
                                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5l1.5-1.5M11 5l1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 px-6 py-3 border-t backdrop-blur-lg transition-colors duration-300 ${isLight ? "bg-white/90 border-gray-200" : "bg-[#0f0f0f]/90 border-[#2a2a2a]"
                }`}>
                <div className="flex items-center justify-between">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 transition-colors ${isActive
                                    ? isLight ? "text-gray-900" : "text-[#D4FF00]"
                                    : isLight ? "text-gray-400" : "text-gray-500"
                                    }`}
                            >
                                <div className={`${isActive ? "scale-110" : "scale-100"} transition-transform`}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                    {/* Mobile Menu / Profile */}
                    <Link
                        href="/dashboard/scan"
                        className={`flex flex-col items-center gap-1 transition-colors ${pathname === "/dashboard/scan"
                            ? isLight ? "text-gray-900" : "text-[#D4FF00]"
                            : isLight ? "text-gray-400" : "text-gray-500"
                            }`}
                    >
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-8 h-8"
                                }
                            }}
                        />
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="lg:ml-60 min-h-screen pb-20 lg:pb-0">
                {/* Top Header */}
                <header className={`sticky top-0 z-30 backdrop-blur-xl px-4 lg:px-8 py-4 border-b transition-colors duration-300 ${isLight ? "bg-white/80 border-gray-200" : "bg-[#0f0f0f]/80 border-[#2a2a2a]"
                    }`}>
                    <div className="flex items-center justify-between">
                        {/* Page Title - Hidden on small mobile if search is active? No, keep it simple */}
                        <h1 className={`text-xl lg:text-2xl font-bold truncate mr-4 ${isLight ? "text-gray-900" : "text-white"}`}>
                            {navItems.find((item) => item.href === pathname)?.name || "Dashboard"}
                        </h1>

                        {/* Right Side */}
                        <div className="flex items-center gap-2 lg:gap-4">
                            {/* Search Bar - Collapsed on mobile to icon? keeping simple for now */}
                            <div className="relative hidden sm:block">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                                    }`}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={isLight ? "#9ca3af" : "#6b7280"} strokeWidth="1.5">
                                        <circle cx="7" cy="7" r="5" />
                                        <path d="M11 11l3 3" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        onKeyDown={handleSearchSubmit}
                                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                        onFocus={() => searchQuery && setShowResults(true)}
                                        className={`bg-transparent border-none outline-none w-32 lg:w-48 text-sm ${isLight ? "text-gray-900 placeholder:text-gray-400" : "text-white placeholder:text-gray-500"
                                            }`}
                                    />
                                </div>
                                {/* Search Results Dropdown */}
                                {showResults && searchResults.length > 0 && (
                                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-lg overflow-hidden ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"
                                        }`}>
                                        {searchResults.map((result) => {
                                            const item = searchableItems.find((i) => i.label === result);
                                            return (
                                                <button
                                                    key={result}
                                                    onClick={() => {
                                                        if (item) router.push(item.href);
                                                        setSearchQuery("");
                                                        setShowResults(false);
                                                    }}
                                                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-[#2a2a2a] text-gray-300"
                                                        }`}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M3 7h8M7 3l4 4-4 4" />
                                                    </svg>
                                                    {result}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Scan Button - Hidden on mobile since it is in bottom nav */}
                            <Link
                                href="/dashboard/scan"
                                className="hidden sm:flex items-center gap-2 px-5 py-2 bg-[#1a1a1a] text-white rounded-full font-medium hover:bg-[#2a2a2a] transition-all"
                            >
                                Scan
                            </Link>

                            {/* Profile - Hidden on mobile main header to save space, moved to bottom? Or keep it. 
                                Actually keep it, good for quick access. 
                            */}
                            <div className="hidden sm:block">
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8 lg:w-10 lg:h-10",
                                        },
                                    }}
                                />
                            </div>

                            {/* Mobile Theme Toggle (since sidebar is hidden) */}
                            <button
                                onClick={toggleTheme}
                                className={`sm:hidden p-2 rounded-full ${isLight ? "bg-gray-100 text-gray-600" : "bg-[#1a1a1a] text-white"}`}
                            >
                                {theme === 'light' ? '🌙' : '☀️'}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 lg:p-8">{children}</div>
            </main>
        </div>
    );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect /dashboard to /dashboard/scan
export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/scan");
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-gray-400">
                Loading scan lab...
            </div>
        </div>
    );
}

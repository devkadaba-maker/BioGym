"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * SessionGuard - Clears user-specific sessionStorage data when the user changes.
 * This prevents data leakage between different users on the same browser.
 * 
 * Place this component at a high level in the component tree (e.g., in layout).
 */
export default function SessionGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const previousUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;

        const currentUserId = user?.id || null;
        const storedUserId = sessionStorage.getItem("biogym-session-user");

        // If there's a user mismatch, clear all scan-related session data
        if (storedUserId && storedUserId !== currentUserId) {
            console.log("[SessionGuard] User changed, clearing session data");
            console.log(`[SessionGuard] Previous: ${storedUserId}, Current: ${currentUserId}`);

            // Clear all scan-related session storage keys
            sessionStorage.removeItem("scanlab-result");
            sessionStorage.removeItem("scanlab-images");
            sessionStorage.removeItem("isScanned");
            sessionStorage.removeItem("biogym-session-user");
        }

        // Store current user ID in session storage
        if (currentUserId) {
            sessionStorage.setItem("biogym-session-user", currentUserId);
        } else {
            // User logged out - clear all session data
            sessionStorage.removeItem("scanlab-result");
            sessionStorage.removeItem("scanlab-images");
            sessionStorage.removeItem("isScanned");
            sessionStorage.removeItem("biogym-session-user");
        }

        previousUserIdRef.current = currentUserId;
    }, [isLoaded, user?.id]);

    return <>{children}</>;
}

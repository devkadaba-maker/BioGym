"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function AdminSetupPage() {
    const { user, isLoaded } = useUser();
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const grantProViaAPI = async (targetUserId: string) => {
        const response = await fetch('/api/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'grantPro', targetUserId })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to grant Pro');
        }

        return await response.json();
    };

    const grantPro = async () => {
        if (!user) {
            toast.error("Not signed in");
            return;
        }

        setStatus("processing");
        addLog(`Attempting to upgrade user: ${user.fullName} (${user.id})...`);

        try {
            await grantProViaAPI(user.id);

            addLog("Success! Firestore document updated.");
            toast.success("Successfully upgraded to Pro!");
            setStatus("success");

            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 2000);

        } catch (error: any) {
            console.error(error);
            addLog(`Error: ${error.message || JSON.stringify(error)}`);
            toast.error("Failed to upgrade. Check console/logs.");
            setStatus("error");
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <p>Loading user data...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                <div className="max-w-md text-center">
                    <h1 className="text-xl font-bold text-red-500 mb-4">Access Denied</h1>
                    <p>Please sign in to the application first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-8 font-sans">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#D4FF00] mb-2">Dev Admin Tools</h1>
                    <p className="text-gray-400">Manage user account status for testing.</p>
                </div>

                <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-neutral-700">
                        <div>
                            <p className="text-sm text-gray-400 uppercase tracking-wider">Current User</p>
                            <p className="font-mono text-lg">{user.fullName}</p>
                            <p className="text-xs text-gray-500 font-mono">{user.id}</p>
                            <p className="text-xs text-gray-500 font-mono">{user.emailAddresses[0]?.emailAddress}</p>
                        </div>
                        <div className="text-right">
                            {user.fullName?.toLowerCase().includes("dev") && (
                                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold mb-2">
                                    DEV ACCOUNT DETECTED
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={grantPro}
                            disabled={status === "processing" || status === "success"}
                            className={`
                                w-full py-4 rounded-xl font-bold text-lg transition-all
                                flex items-center justify-center gap-2
                                ${status === "success"
                                    ? "bg-green-500 text-black cursor-default"
                                    : "bg-[#D4FF00] text-black hover:bg-[#b8dd00] active:scale-95"
                                }
                                ${status === "processing" ? "opacity-50 cursor-wait" : ""}
                            `}
                        >
                            {status === "processing" && (
                                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {status === "idle" && "GRANT PRO ACCESS (LIFETIME)"}
                            {status === "processing" && "UPGRADING..."}
                            {status === "success" && "✅ UPGRADE COMPLETE"}
                            {status === "error" && "⚠️ FAILED - RETRY"}
                        </button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            This will manually set your Firestore subscription status to 'active' valid until 2099.
                        </p>
                    </div>
                </div>

                {/* Grant Pro to Any User */}
                <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 space-y-4">
                    <div className="pb-4 border-b border-neutral-700">
                        <p className="text-sm text-gray-400 uppercase tracking-wider">Grant Pro to Any User</p>
                        <p className="text-xs text-gray-500 mt-1">Enter a Clerk user ID to grant Pro access</p>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="text"
                            id="targetUserId"
                            placeholder="user_2abc123..."
                            defaultValue="user_393F"
                            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-600 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                        />
                        <button
                            onClick={async () => {
                                const input = document.getElementById('targetUserId') as HTMLInputElement;
                                const targetId = input?.value?.trim();
                                if (!targetId) {
                                    toast.error("Please enter a user ID");
                                    return;
                                }
                                addLog(`Granting Pro to: ${targetId}...`);
                                try {
                                    await grantProViaAPI(targetId);
                                    addLog(`✅ Success! ${targetId} is now Pro.`);
                                    toast.success(`${targetId} upgraded to Pro!`);
                                } catch (error: any) {
                                    addLog(`Error: ${error.message}`);
                                    toast.error("Failed to upgrade user");
                                }
                            }}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all active:scale-95"
                        >
                            GRANT PRO TO USER ID
                        </button>
                    </div>
                </div>

                {log.length > 0 && (
                    <div className="bg-black/50 p-4 rounded-xl border border-neutral-800 font-mono text-xs text-gray-300">
                        {log.map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface SubscriptionStatus {
    status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    trialEnd?: string;
}

interface SubscriptionContextType {
    isLoading: boolean;
    isPremium: boolean;
    isTrialing: boolean;
    subscription: SubscriptionStatus | null;
    scansRemaining: number;
    canScan: boolean;
    refreshSubscription: () => Promise<void>;
    openCheckout: () => Promise<void>;
    openPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [canScan, setCanScan] = useState(true);
    const [scansRemaining, setScansRemaining] = useState(1);

    const fetchSubscriptionStatus = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/stripe/status');
            if (response.ok) {
                const data = await response.json();
                setSubscription(data.subscription);
                setIsPremium(data.isPremium);
                setCanScan(data.canScan);
                setScansRemaining(data.scansRemaining);
            }
        } catch (error) {
            console.error('Failed to fetch subscription status:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isLoaded) {
            fetchSubscriptionStatus();
        }
    }, [isLoaded, fetchSubscriptionStatus]);

    const openCheckout = async () => {
        try {
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                }
            } else {
                console.error('Failed to create checkout session');
            }
        } catch (error) {
            console.error('Checkout error:', error);
        }
    };

    const openPortal = async () => {
        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok && data.url) {
                window.location.href = data.url;
            } else if (data.isManualOverride) {
                // Handle manually overridden subscriptions
                toast.info('Your premium access was granted manually. No billing portal is available.');
            } else {
                toast.error('Failed to open billing portal');
                console.error('Failed to open portal:', data.error);
            }
        } catch (error) {
            toast.error('Failed to open billing portal');
            console.error('Portal error:', error);
        }
    };

    const isTrialing = subscription?.status === 'trialing';

    return (
        <SubscriptionContext.Provider
            value={{
                isLoading,
                isPremium,
                isTrialing,
                subscription,
                scansRemaining,
                canScan,
                refreshSubscription: fetchSubscriptionStatus,
                openCheckout,
                openPortal,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}

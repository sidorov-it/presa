import { useState, useEffect, useCallback } from 'react';
import { UserSubscription, CreateSubscriptionRequest, CreateSubscriptionResponse } from '@/types/subscriptions';
import { invalidateSubscriptionCache } from './useSubscriptionCheck';

interface UseSubscriptionsReturn {
    activeSubscription: UserSubscription | null;
    loading: boolean;
    error: string | null;
    createSubscription: (planId: string) => Promise<CreateSubscriptionResponse>;
    cancelSubscription: (subscriptionId: string) => Promise<{ success: boolean; error?: string }>;
    refreshSubscriptionStatus: () => Promise<void>;
}

export const useSubscriptions = (): UseSubscriptionsReturn => {
    const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSubscriptionStatus = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch('/api/subscriptions/status');
            if (response.ok) {
                const data = await response.json();
                setActiveSubscription(data.subscription || null);
                // Инвалидируем кеш легковесного хука
                invalidateSubscriptionCache();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to load subscription status');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription status';
            setError(errorMessage);
        }
    }, []);

    // Create subscription
    const createSubscription = useCallback(async (planId: string): Promise<CreateSubscriptionResponse> => {
        try {
            setError(null);
            const response = await fetch('/api/subscriptions/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planId } as CreateSubscriptionRequest),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create subscription');
            }

            const result = await response.json();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
            setError(errorMessage);
            return { success: false, error: errorMessage, publicId: '' };
        }
    }, []);

    // Cancel subscription
    const cancelSubscription = useCallback(
        async (subscriptionId: string): Promise<{ success: boolean; error?: string }> => {
            try {
                setError(null);
                const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to cancel subscription');
                }

                await loadSubscriptionStatus();
                return { success: true };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
                setError(errorMessage);
                return { success: false, error: errorMessage };
            }
        },
        [loadSubscriptionStatus]
    );

    // Refresh subscription status
    const refreshSubscriptionStatus = useCallback(async () => {
        setLoading(true);
        await loadSubscriptionStatus();
        setLoading(false);
    }, [loadSubscriptionStatus]);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            await Promise.all([loadSubscriptionStatus()]);

            setLoading(false);
        };

        loadData();
    }, [loadSubscriptionStatus]);

    return {
        // plans,
        activeSubscription,
        loading,
        error,
        createSubscription,
        cancelSubscription,
        refreshSubscriptionStatus,
    };
};

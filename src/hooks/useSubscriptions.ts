import { useState, useEffect, useCallback } from 'react';
import {
    SubscriptionPlan,
    UserSubscription,
    SubscriptionFeatures,
    CreateSubscriptionRequest,
    CreateSubscriptionResponse,
} from '@/types/subscriptions';

interface UseSubscriptionsReturn {
    plans: SubscriptionPlan[];
    userSubscriptions: UserSubscription[] | null;
    lastUserSubscription: UserSubscription | null;
    features: SubscriptionFeatures | null;
    hasActiveSubscription: boolean;
    loading: boolean;
    error: string | null;
    createSubscription: (planId: string) => Promise<CreateSubscriptionResponse>;
    changeSubscriptionPlan: (planId: string, startImmediately: boolean) => Promise<{ success: boolean; error?: string }>;
    resumeSubscription: (planId?: string) => Promise<{ success: boolean; error?: string }>;
    refreshSubscriptionStatus: () => Promise<void>;
}

export const useSubscriptions = (): UseSubscriptionsReturn => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[] | null>(null);
    const [lastUserSubscription, setLastUserSubscription] = useState<UserSubscription | null>(null);
    const [features, setFeatures] = useState<SubscriptionFeatures | null>(null);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load subscription plans
    const loadPlans = useCallback(async () => {
        try {
            const response = await fetch('/api/subscriptions/plans');
            if (!response.ok) {
                throw new Error('Failed to fetch subscription plans');
            }
            const data = await response.json();
            if (data.success) {
                setPlans(data.plans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.price - b.price));
            }
        } catch (err) {
            console.error('Error loading subscription plans:', err);
            setError(err instanceof Error ? err.message : 'Failed to load plans');
        }
    }, []);

    // Load user subscription status
    const loadSubscriptionStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/subscriptions/status');
            if (!response.ok) {
                if (response.status === 401) {
                    // User not authenticated, clear subscription data
                    setUserSubscriptions(null);
                    setLastUserSubscription(null);
                    setFeatures(null);
                    setHasActiveSubscription(false);
                    return;
                }
                throw new Error('Failed to fetch subscription status');
            }
            const data = await response.json();
            if (data.success) {
                setUserSubscriptions(data.subscriptions);
                const lastSubscription = data.subscriptions.sort((a: UserSubscription, b: UserSubscription) => {
                    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
                })[0];

                setLastUserSubscription(lastSubscription);
                setFeatures(data.features);
                setHasActiveSubscription(data.hasActiveSubscription);
            }
        } catch (err) {
            console.error('Error loading subscription status:', err);
            setError(err instanceof Error ? err.message : 'Failed to load subscription status');
        }
    }, []);

    // Create subscription
    const createSubscription = useCallback(async (planId: string): Promise<CreateSubscriptionResponse> => {
        try {
            setError(null);
            const requestData: CreateSubscriptionRequest = { planId };

            const response = await fetch('/api/subscriptions/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create subscription');
            }

            const data = await response.json();
            return {
                success: true,
                subscriptionId: data.subscriptionId,
                paymentData: data.paymentData,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }, []);

    // Change subscription plan
    const changeSubscriptionPlan = useCallback(async (planId: string, startImmediately: boolean): Promise<{ success: boolean; error?: string }> => {
        try {
            setError(null);
            const response = await fetch('/api/subscriptions/change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPlanId: planId,
                    startImmediately,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to change subscription plan');
            }

            await loadSubscriptionStatus();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to change subscription plan';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [loadSubscriptionStatus]);

    // Resume subscription
    const resumeSubscription = useCallback(async (planId?: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setError(null);
            const response = await fetch('/api/subscriptions/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to resume subscription');
            }

            await loadSubscriptionStatus();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to resume subscription';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [loadSubscriptionStatus]);

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

            await Promise.all([loadPlans(), loadSubscriptionStatus()]);

            setLoading(false);
        };

        loadData();
    }, [loadPlans, loadSubscriptionStatus]);

    return {
        plans,
        userSubscriptions,
        lastUserSubscription,
        features,
        hasActiveSubscription,
        loading,
        error,
        createSubscription,
        changeSubscriptionPlan,
        resumeSubscription,
        refreshSubscriptionStatus,
    };
};

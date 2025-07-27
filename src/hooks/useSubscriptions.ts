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
    activeSubscription: UserSubscription | null;
    lastActiveSubscription: UserSubscription | null;
    nextSubscription: UserSubscription | null;
    features: SubscriptionFeatures | null;
    hasActiveSubscription: boolean;
    loading: boolean;
    error: string | null;
    createSubscription: (planId: string) => Promise<CreateSubscriptionResponse>;
    changeSubscriptionPlan: (
        planId: string,
        startImmediately: boolean
    ) => Promise<{ success: boolean; error?: string }>;
    resumeSubscription: (planId?: string) => Promise<{ success: boolean; error?: string }>;
    cancelSubscription: (subscriptionId: string) => Promise<{ success: boolean; error?: string }>;
    restartSubscription: (subscriptionId: string) => Promise<{ success: boolean; error?: string }>;
    cancelPlanChange: (subscriptionId: string) => Promise<{ success: boolean; error?: string }>;
    retryPayment: (subscriptionId: string) => Promise<{ success: boolean; paymentData?: any; error?: string }>;
    refreshSubscriptionStatus: () => Promise<void>;
}

export const useSubscriptions = (): UseSubscriptionsReturn => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[] | null>(null);
    // const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);

    const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
    const [lastActiveSubscription, setLastActiveSubscription] = useState<UserSubscription | null>(null);
    const [nextSubscription, setNextSubscription] = useState<UserSubscription | null>(null);
    const [features, setFeatures] = useState<SubscriptionFeatures | null>(null);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load subscription plans
    const loadPlans = useCallback(async () => {
        try {
            const response = await fetch('/api/subscriptions/plans');
            if (response.ok) {
                const data = await response.json();
                setPlans(data.plans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.price - b.price));
            } else {
                console.error('Failed to load subscription plans');
            }
        } catch (err) {
            console.error('Error loading subscription plans:', err);
        }
    }, []);

    // Load subscription status
    const loadSubscriptionStatus = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch('/api/subscriptions/status');
            if (response.ok) {
                const data = await response.json();

                setActiveSubscription(data.activeSubscription);
                setLastActiveSubscription(data.lastActiveSubscription);
                setNextSubscription(data.nextSubscription);

                setUserSubscriptions(data.subscriptions);
                // setCurrentSubscription(data.activeSubscription);
                // setNextSubscription(data.nextSubscription);
                setFeatures(data.features);
                setHasActiveSubscription(data.hasActiveSubscription);
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
            return { success: false, error: errorMessage };
        }
    }, []);

    // Change subscription plan
    const changeSubscriptionPlan = useCallback(
        async (planId: string, startImmediately: boolean): Promise<{ success: boolean; error?: string }> => {
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
        },
        [loadSubscriptionStatus]
    );

    // Resume subscription
    const resumeSubscription = useCallback(
        async (planId?: string): Promise<{ success: boolean; error?: string }> => {
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
        },
        [loadSubscriptionStatus]
    );

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

    // Restart subscription
    const restartSubscription = useCallback(
        async (subscriptionId: string): Promise<{ success: boolean; error?: string }> => {
            try {
                setError(null);
                const response = await fetch(`/api/subscriptions/${subscriptionId}/restart`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to restart subscription');
                }

                await loadSubscriptionStatus();
                return { success: true };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to restart subscription';
                setError(errorMessage);
                return { success: false, error: errorMessage };
            }
        },
        [loadSubscriptionStatus]
    );

    // Cancel plan change
    const cancelPlanChange = useCallback(
        async (subscriptionId: string): Promise<{ success: boolean; error?: string }> => {
            try {
                setError(null);
                const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel-plan-change`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to cancel plan change');
                }

                await loadSubscriptionStatus();
                return { success: true };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to cancel plan change';
                setError(errorMessage);
                return { success: false, error: errorMessage };
            }
        },
        [loadSubscriptionStatus]
    );

    // Retry payment
    const retryPayment = useCallback(
        async (subscriptionId: string): Promise<{ success: boolean; paymentData?: any; error?: string }> => {
            try {
                setError(null);
                const response = await fetch(`/api/subscriptions/${subscriptionId}/retry-payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to retry payment');
                }

                const result = await response.json();
                return { success: true, paymentData: result.paymentData };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to retry payment';
                setError(errorMessage);
                return { success: false, error: errorMessage };
            }
        },
        []
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

            await Promise.all([loadPlans(), loadSubscriptionStatus()]);

            setLoading(false);
        };

        loadData();
    }, [loadPlans, loadSubscriptionStatus]);

    return {
        plans,
        userSubscriptions,
        activeSubscription,
        lastActiveSubscription,
        nextSubscription,
        features,
        hasActiveSubscription,
        loading,
        error,
        createSubscription,
        changeSubscriptionPlan,
        resumeSubscription,
        cancelSubscription,
        restartSubscription,
        cancelPlanChange,
        retryPayment,
        refreshSubscriptionStatus,
    };
};

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionFeatures } from '@/types/subscriptions';
import { logCaughtError } from '@/utils/errorReporting';

interface UseSubscriptionCheckReturn {
    hasActiveSubscription: boolean;
    features: SubscriptionFeatures;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

// Дефолтные возможности для пользователей без подписки
const DEFAULT_FEATURES: SubscriptionFeatures = {
    maxSlides: 10,
    hideBranding: false,
    maxDocumentSize: 5, // 5MB
    priority: false,
    customExport: false,
};

const SUBSCRIPTION_FEATURES: SubscriptionFeatures = {
    maxSlides: 20,
    hideBranding: true,
    maxDocumentSize: 10, // 10MB
    priority: true,
    customExport: true,
};

// Кеш для оптимизации запросов
let cachedData: {
    hasActiveSubscription: boolean;
    features: SubscriptionFeatures;
    timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

/**
 * Легковесный хук для проверки статуса подписки пользователя
 * Оптимизирован для частого использования в UI компонентах
 */
export const useSubscriptionCheck = (): UseSubscriptionCheckReturn => {
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [features, setFeatures] = useState<SubscriptionFeatures>(DEFAULT_FEATURES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSubscriptionStatus = useCallback(async (useCache = true) => {
        try {
            setError(null);

            // Проверяем кеш
            if (useCache && cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
                setHasActiveSubscription(cachedData.hasActiveSubscription);
                setFeatures(cachedData.features);
                setLoading(false);
                return;
            }

            const response = await fetch('/api/subscriptions/status');
            if (response.ok) {
                const data = await response.json();
                const hasActive =
                    (data.subscription?.status === 'active' || data.subscription?.status === 'cancelled') &&
                    new Date(data.subscription.endDate) > new Date();

                let subscriptionFeatures = DEFAULT_FEATURES;

                if (hasActive) {
                    subscriptionFeatures = SUBSCRIPTION_FEATURES;
                }

                // Обновляем кеш
                cachedData = {
                    hasActiveSubscription: hasActive,
                    features: subscriptionFeatures,
                    timestamp: Date.now(),
                };

                setHasActiveSubscription(hasActive);
                setFeatures(subscriptionFeatures);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to check subscription status');

                // В случае ошибки используем дефолтные значения
                setHasActiveSubscription(false);
                setFeatures(DEFAULT_FEATURES);
            }
        } catch (err) {
            logCaughtError(err, {
                action: 'Легковесная проверка статуса подписки',
                component: 'useSubscriptionCheck',
            });
            const errorMessage = err instanceof Error ? err.message : 'Failed to check subscription status';
            setError(errorMessage);

            // В случае ошибки используем дефолтные значения
            setHasActiveSubscription(false);
            setFeatures(DEFAULT_FEATURES);
        } finally {
            setLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        await loadSubscriptionStatus(false); // Принудительно обновляем без кеша
    }, [loadSubscriptionStatus]);

    // Загружаем данные при монтировании компонента
    useEffect(() => {
        loadSubscriptionStatus();
    }, [loadSubscriptionStatus]);

    return {
        hasActiveSubscription,
        features,
        loading,
        error,
        refresh,
    };
};

/**
 * Функция для инвалидации кеша (используется после изменения подписки)
 */
export const invalidateSubscriptionCache = () => {
    cachedData = null;
};

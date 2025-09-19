import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasActiveSubscription } from '@/utils/subscriptions';
import { SubscriptionFeatures } from '@/types/subscriptions';

/**
 * Проверяет наличие активной подписки на сервере
 * Используется в API routes и server components
 */
export const checkServerSubscription = async (): Promise<{
    hasActiveSubscription: boolean;
    userId?: string;
}> => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return {
            hasActiveSubscription: false,
        };
    }

    const hasActive = await hasActiveSubscription(session.user.id);

    return {
        hasActiveSubscription: hasActive,
        userId: session.user.id,
    };
};

/**
 * Проверяет доступность функции на основе подписки
 */
export const checkFeatureAccess = (
    feature: keyof SubscriptionFeatures,
    features: SubscriptionFeatures,
    requestedValue?: number
): boolean => {
    switch (feature) {
        case 'maxSlides':
            return requestedValue ? requestedValue <= features.maxSlides : true;
        case 'maxDocumentSize':
            return requestedValue ? requestedValue <= features.maxDocumentSize : true;
        default:
            return features[feature] as boolean;
    }
};

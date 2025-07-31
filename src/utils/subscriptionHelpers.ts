import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasActiveSubscription, getSubscriptionFeatures } from '@/utils/subscriptions';
import { SubscriptionFeatures } from '@/types/subscriptions';

/**
 * Проверяет наличие активной подписки на сервере
 * Используется в API routes и server components
 */
export const checkServerSubscription = async (): Promise<{
    hasActiveSubscription: boolean;
    features: SubscriptionFeatures;
    userId?: string;
}> => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return {
            hasActiveSubscription: false,
            features: {
                maxSlides: 10,
                hideBranding: false,
                maxDocumentSize: 5,
                priority: false,
                customExport: false,
            },
        };
    }

    const hasActive = await hasActiveSubscription(session.user.id);
    const features = await getSubscriptionFeatures(session.user.id) || {
        maxSlides: hasActive ? 20 : 10,
        hideBranding: hasActive,
        maxDocumentSize: hasActive ? 50 : 5,
        priority: hasActive,
        customExport: hasActive,
    };

    return {
        hasActiveSubscription: hasActive,
        features,
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
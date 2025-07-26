import { prisma } from '@/lib/prisma';
import { SubscriptionStatus, SubscriptionInterval } from '@prisma/client';
import { SubscriptionFeatures, UserSubscription } from '@/types/subscriptions';

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.userSubscription.findFirst({
        where: {
            userId,
            status: SubscriptionStatus.active,
            endDate: {
                gte: new Date(),
            },
        },
    });

    return !!subscription;
}

/**
 * Get user's active subscription with plan details
 */
export async function getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
    const subscription = await prisma.userSubscription.findFirst({
        where: {
            userId,
            status: SubscriptionStatus.active,
            endDate: {
                gte: new Date(),
            },
        },
        include: {
            plan: true,
        },
    });

    return subscription;
}

/**
 * Get subscription features for a user
 */
export async function getSubscriptionFeatures(userId: string): Promise<SubscriptionFeatures | null> {
    const subscription = await getUserActiveSubscription(userId);
    
    if (!subscription?.plan?.features) {
        return null;
    }

    return subscription.plan.features as SubscriptionFeatures;
}

/**
 * Get default subscription features for non-subscribers
 */
export function getDefaultFeatures(): SubscriptionFeatures {
    return {
        maxSlides: 10,
        hideBranding: false,
        maxDocumentSize: 5, // 5MB for free users
        priority: false,
        customExport: false,
    };
}

/**
 * Get effective features for a user (subscription or default)
 */
export async function getUserFeatures(userId: string): Promise<SubscriptionFeatures> {
    const subscriptionFeatures = await getSubscriptionFeatures(userId);
    return subscriptionFeatures || getDefaultFeatures();
}

/**
 * Check if user can create more slides based on their subscription
 */
export async function canCreateSlides(userId: string, currentSlideCount: number): Promise<boolean> {
    const features = await getUserFeatures(userId);
    return currentSlideCount < features.maxSlides;
}

/**
 * Check if user can upload documents of a certain size
 */
export async function canUploadDocument(userId: string, fileSizeInMB: number): Promise<boolean> {
    const features = await getUserFeatures(userId);
    return fileSizeInMB <= features.maxDocumentSize;
}

/**
 * Check if exports should hide branding for this user
 */
export async function shouldHideBranding(userId: string): Promise<boolean> {
    const features = await getUserFeatures(userId);
    return features.hideBranding;
}

/**
 * Calculate subscription end date based on interval
 */
export function calculateSubscriptionEndDate(startDate: Date, interval: SubscriptionInterval): Date {
    const endDate = new Date(startDate);
    
    switch (interval) {
        case SubscriptionInterval.monthly:
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case SubscriptionInterval.quarterly:
            endDate.setMonth(endDate.getMonth() + 3);
            break;
        case SubscriptionInterval.semiannual:
            endDate.setMonth(endDate.getMonth() + 6);
            break;
    }
    
    return endDate;
}

/**
 * Calculate next billing date based on interval
 */
export function calculateNextBillingDate(currentDate: Date, interval: SubscriptionInterval): Date {
    return calculateSubscriptionEndDate(currentDate, interval);
}

/**
 * Cancel user subscription
 */
export async function cancelUserSubscription(userId: string, reason?: string): Promise<boolean> {
    try {
        await prisma.userSubscription.updateMany({
            where: {
                userId,
                status: SubscriptionStatus.active,
            },
            data: {
                status: SubscriptionStatus.cancelled,
                cancelledAt: new Date(),
                cancelReason: reason,
            },
        });

        return true;
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return false;
    }
}

/**
 * Activate subscription after successful payment
 */
export async function activateSubscription(subscriptionId: string, cloudpaymentsId: string): Promise<boolean> {
    try {
        const subscription = await prisma.userSubscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true },
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        const now = new Date();
        const endDate = calculateSubscriptionEndDate(now, subscription.plan.interval);
        const nextBillingDate = calculateNextBillingDate(now, subscription.plan.interval);

        await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: {
                status: SubscriptionStatus.active,
                startDate: now,
                endDate,
                nextBillingDate,
                cloudpaymentsId,
            },
        });

        return true;
    } catch (error) {
        console.error('Error activating subscription:', error);
        return false;
    }
} 
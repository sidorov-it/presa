import { prisma } from '@/lib/prisma';
import { SubscriptionStatus, SubscriptionInterval } from '@prisma/client';
import { SubscriptionFeatures, UserSubscription } from '@/types/subscriptions';

/**
 * Check if user has an active subscription with real-time validation
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

    // If subscription exists but is expired, update status
    if (subscription && subscription.endDate < new Date()) {
        await expireSubscription(subscription.id);
        return false;
    }

    return !!subscription;
}

/**
 * Get user's active subscription with plan details and real-time validation
 */
export async function getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
    const subscription = await prisma.userSubscription.findFirst({
        where: {
            userId,
            OR: [
                { status: SubscriptionStatus.active },
                { status: SubscriptionStatus.cancelled },
                { status: SubscriptionStatus.expired },
            ],
        },
        include: {
            plan: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Real-time status validation
    if (subscription) {
        const now = new Date();
        const isExpired = subscription.endDate < now;
        
        // Update status if subscription has expired
        if (isExpired && subscription.status === SubscriptionStatus.active) {
            await expireSubscription(subscription.id);
            subscription.status = SubscriptionStatus.expired;
        }
        
        // Update status if cancelled subscription has reached end date
        if (isExpired && subscription.status === SubscriptionStatus.cancelled) {
            await expireSubscription(subscription.id);
            subscription.status = SubscriptionStatus.expired;
        }
    }

    return subscription;
}

/**
 * Get subscription features for a user with fallback validation
 */
export async function getSubscriptionFeatures(userId: string): Promise<SubscriptionFeatures | null> {
    try {
        const subscription = await getUserActiveSubscription(userId);
        
        // Only return features for truly active subscriptions
        if (!subscription || subscription.status !== SubscriptionStatus.active || subscription.endDate < new Date()) {
            return null;
        }

        if (!subscription.plan?.features) {
            return null;
        }

        return subscription.plan.features as SubscriptionFeatures;
    } catch (error) {
        console.error('Error getting subscription features:', error);
        return null; // Fail-safe: return null to use default features
    }
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
 * Get effective features for a user with proper error handling
 */
export async function getUserFeatures(userId: string): Promise<SubscriptionFeatures> {
    try {
        const subscriptionFeatures = await getSubscriptionFeatures(userId);
        return subscriptionFeatures || getDefaultFeatures();
    } catch (error) {
        console.error('Error getting user features, falling back to default:', error);
        return getDefaultFeatures(); // Always return something
    }
}

/**
 * Check if user can create more slides based on their subscription with real-time validation
 */
export async function canCreateSlides(userId: string, currentSlideCount: number): Promise<boolean> {
    try {
        const features = await getUserFeatures(userId);
        return currentSlideCount < features.maxSlides;
    } catch (error) {
        console.error('Error checking slide creation limit:', error);
        // Fail-safe: use default limit
        return currentSlideCount < getDefaultFeatures().maxSlides;
    }
}

/**
 * Check if user can upload documents of a certain size with real-time validation
 */
export async function canUploadDocument(userId: string, fileSizeInMB: number): Promise<boolean> {
    try {
        const features = await getUserFeatures(userId);
        return fileSizeInMB <= features.maxDocumentSize;
    } catch (error) {
        console.error('Error checking document upload limit:', error);
        // Fail-safe: use default limit
        return fileSizeInMB <= getDefaultFeatures().maxDocumentSize;
    }
}

/**
 * Check if exports should hide branding for this user with real-time validation
 */
export async function shouldHideBranding(userId: string): Promise<boolean> {
    try {
        const features = await getUserFeatures(userId);
        return features.hideBranding;
    } catch (error) {
        console.error('Error checking branding visibility:', error);
        // Fail-safe: show branding if there's an error
        return false;
    }
}

/**
 * Validate subscription status and sync with database
 */
export async function validateAndSyncSubscriptionStatus(userId: string): Promise<void> {
    try {
        const subscriptions = await prisma.userSubscription.findMany({
            where: {
                userId,
                status: {
                    in: [SubscriptionStatus.active, SubscriptionStatus.cancelled],
                },
            },
        });

        const now = new Date();

        for (const subscription of subscriptions) {
            if (subscription.endDate < now && subscription.status !== SubscriptionStatus.expired) {
                await expireSubscription(subscription.id);
            }
        }
    } catch (error) {
        console.error('Error validating subscription status:', error);
        // Don't throw - this is a background sync operation
    }
}

/**
 * Expire a subscription
 */
async function expireSubscription(subscriptionId: string): Promise<void> {
    try {
        await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: {
                status: SubscriptionStatus.expired,
            },
        });
        console.log(`Subscription ${subscriptionId} marked as expired`);
    } catch (error) {
        console.error(`Error expiring subscription ${subscriptionId}:`, error);
    }
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
 * Activate subscription after successful payment with validation
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

        // Validate that subscription can be activated
        if (subscription.status === SubscriptionStatus.active && subscription.endDate > new Date()) {
            console.log(`Subscription ${subscriptionId} is already active`);
            return true;
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

        console.log(`Subscription ${subscriptionId} activated successfully`);
        return true;
    } catch (error) {
        console.error('Error activating subscription:', error);
        return false;
    }
}

/**
 * Check subscription health and auto-fix common issues
 */
export async function performSubscriptionHealthCheck(userId: string): Promise<void> {
    try {
        await validateAndSyncSubscriptionStatus(userId);
        
        // Additional health checks can be added here
        // e.g., check for duplicate active subscriptions, orphaned payments, etc.
        
    } catch (error) {
        console.error('Subscription health check failed:', error);
    }
} 
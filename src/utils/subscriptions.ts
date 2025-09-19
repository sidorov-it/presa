import { prisma } from '@/lib/prisma';
import { SubscriptionInterval, SubscriptionStatus } from '@prisma/client';
import { SubscriptionFeatures } from '@/types/subscriptions';

/**
 * Check if user has active subscription with real-time validation
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
    try {
        // First, sync subscription status to handle expired subscriptions
        await validateAndSyncSubscriptionStatus(userId);

        const activeSubscription = await prisma.userSubscription.findFirst({
            where: {
                userId,
                status: SubscriptionStatus.active,
                endDate: {
                    gt: new Date(),
                },
            },
        });

        return !!activeSubscription;
    } catch (error) {
        console.error('Error checking active subscription:', error);
        return false;
    }
}

/**
 * Get user's active subscription with real-time status updates
 */
export async function getUserSubscriptions(userId: string) {
    try {
        // First, sync subscription status
        await validateAndSyncSubscriptionStatus(userId);

        const subscriptions = await prisma.userSubscription.findMany({
            where: {
                userId,
                status: {
                    in: [SubscriptionStatus.active, SubscriptionStatus.cancelled, SubscriptionStatus.expired],
                },
            },
            include: {
                subscriptionPlan: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return subscriptions;
    } catch (error) {
        console.error('Error getting user subscription:', error);
        return null;
    }
}

/**
 * Get subscription features for active subscription only
 */
export async function getSubscriptionFeatures(userId: string): Promise<SubscriptionFeatures | null> {
    try {
        const subscription = await prisma.userSubscription.findFirst({
            where: {
                userId,
                status: SubscriptionStatus.active,
                endDate: {
                    gt: new Date(),
                },
            },
            include: {
                subscriptionPlan: true,
            },
        });

        if (!subscription || !subscription.subscriptionPlan) {
            return null;
        }

        // Properly type the features field
        const features = subscription.subscriptionPlan.features as unknown as SubscriptionFeatures;
        return features;
    } catch (error) {
        console.error('Error getting subscription features:', error);
        return null;
    }
}

/**
 * Get default features for non-subscribers
 */
export function getDefaultFeatures(): SubscriptionFeatures {
    return {
        maxSlides: 10,
        hideBranding: false,
        maxDocumentSize: 10, // 10MB
        priority: false,
        customExport: false,
    };
}

/**
 * Get effective user features (subscription or default)
 */
export async function getUserFeatures(userId: string): Promise<SubscriptionFeatures> {
    try {
        const subscriptionFeatures = await getSubscriptionFeatures(userId);
        console.log('subscriptionFeatures', subscriptionFeatures);
        return subscriptionFeatures || getDefaultFeatures();
    } catch (error) {
        console.error('Error getting user features:', error);
        return getDefaultFeatures();
    }
}

/**
 * Check if user can create more slides
 */
export async function canCreateSlides(userId: string, currentSlideCount: number): Promise<boolean> {
    const features = await getUserFeatures(userId);
    return currentSlideCount < features.maxSlides;
}

/**
 * Check if user can upload document of given size
 */
export async function canUploadDocument(userId: string, fileSizeInMB: number): Promise<boolean> {
    const features = await getUserFeatures(userId);
    return fileSizeInMB <= features.maxDocumentSize;
}

/**
 * Check if branding should be hidden for user
 */
export async function shouldHideBranding(userId: string): Promise<boolean> {
    const features = await getUserFeatures(userId);
    return features.hideBranding;
}

/**
 * Validate and sync subscription status for a user
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
async function expireSubscription(userSubscriptionId: string): Promise<void> {
    try {
        await prisma.userSubscription.update({
            where: { id: userSubscriptionId },
            data: {
                status: SubscriptionStatus.expired,
            },
        });
        console.log(`Subscription ${userSubscriptionId} marked as expired`);
    } catch (error) {
        console.error(`Error expiring subscription ${userSubscriptionId}:`, error);
    }
}

/**
 * Calculate subscription end date based on interval
 */
export function calculateSubscriptionEndDate(startDate: Date, interval: SubscriptionInterval): Date {
    const endDate = new Date(startDate);

    switch (interval) {
        case SubscriptionInterval.daily:
            endDate.setDate(endDate.getDate() + 1);
            break;
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
 * Get CloudPayments recurrent interval from subscription interval
 */
export function getCloudPaymentsInterval(interval: SubscriptionInterval): {
    period: number;
    interval: 'Day' | 'Week' | 'Month';
} {
    switch (interval) {
        case SubscriptionInterval.monthly:
            return { period: 1, interval: 'Month' };
        case SubscriptionInterval.quarterly:
            return { period: 3, interval: 'Month' };
        case SubscriptionInterval.semiannual:
            return { period: 6, interval: 'Month' };
        default:
            return { period: 1, interval: 'Month' };
    }
}

/**
 * Generate CloudPayments receipt for subscription
 */
export function generateSubscriptionReceipt(plan: any, userEmail?: string): any {
    return {
        Items: [
            {
                label: `Подписка ${plan.name}`,
                price: plan.price,
                quantity: 1.0,
                amount: plan.price,
                vat: 0, // НДС не облагается
                method: 0, // полный расчет
                object: 4, // услуга
            },
        ],
        taxationSystem: 1, // упрощенная система налогообложения
        email: userEmail || '',
        phone: '',
        isBso: false,
        amounts: {
            electronic: plan.price,
            advancePayment: 0.0,
            credit: 0.0,
            provision: 0.0,
        },
    };
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
            include: { subscriptionPlan: true },
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
        const endDate = calculateSubscriptionEndDate(now, subscription.subscriptionPlan.interval);
        const nextBillingDate = calculateNextBillingDate(now, subscription.subscriptionPlan.interval);

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
 * Extend active subscription after successful recurring payment
 */
export async function extendSubscription(subscriptionId: string, paymentId: string): Promise<boolean> {
    try {
        const subscription = await prisma.userSubscription.findUnique({
            where: { id: subscriptionId },
            include: { subscriptionPlan: true },
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        // Calculate new end date from current end date (not from now)
        const currentEndDate = subscription.endDate;
        const newEndDate = calculateSubscriptionEndDate(currentEndDate, subscription.subscriptionPlan.interval);
        const nextBillingDate = calculateNextBillingDate(new Date(), subscription.subscriptionPlan.interval);

        await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: {
                endDate: newEndDate,
                nextBillingDate,
                lastPaymentId: paymentId,
                status: SubscriptionStatus.active,
            },
        });

        console.log(`Subscription ${subscriptionId} extended until ${newEndDate.toISOString()}`);
        return true;
    } catch (error) {
        console.error('Error extending subscription:', error);
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

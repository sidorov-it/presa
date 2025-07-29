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
                plan: true,
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
                plan: true,
            },
        });

        if (!subscription || !subscription.plan) {
            return null;
        }

        // Properly type the features field
        const features = subscription.plan.features as unknown as SubscriptionFeatures;
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
 * Extend active subscription after successful recurring payment
 */
export async function extendSubscription(subscriptionId: string, paymentId: string): Promise<boolean> {
    try {
        const subscription = await prisma.userSubscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true },
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        // Calculate new end date from current end date (not from now)
        const currentEndDate = subscription.endDate;
        const newEndDate = calculateSubscriptionEndDate(currentEndDate, subscription.plan.interval);
        const nextBillingDate = calculateNextBillingDate(new Date(), subscription.plan.interval);

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

/**
 * Change user's subscription plan
 */
export async function changeSubscriptionPlan(
    userId: string,
    newPlanId: string,
    startImmediately: boolean = false
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
        // Get current active subscription
        const currentSubscription = await prisma.userSubscription.findFirst({
            where: {
                userId,
                status: {
                    in: [SubscriptionStatus.active, SubscriptionStatus.expired, SubscriptionStatus.cancelled],
                },
                endDate: {
                    gt: new Date(),
                },
            },
            include: {
                plan: true,
            },
        });

        if (!currentSubscription) {
            return {
                success: false,
                error: 'No active subscription found',
            };
        }

        // Get new plan
        const newPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: newPlanId, isActive: true },
        });

        if (!newPlan) {
            return {
                success: false,
                error: 'New subscription plan not found',
            };
        }

        // Check if user is trying to change to the same plan
        if (currentSubscription.planId === newPlanId) {
            return {
                success: false,
                error: 'Cannot change to the same plan',
            };
        }

        if (startImmediately) {
            // Immediate plan change - cancel current and create new
            return await changePlanImmediately(currentSubscription, newPlan);
        } else {
            // Schedule plan change for end of current period
            return await schedulePlanChange(currentSubscription, newPlan);
        }
    } catch (error) {
        console.error('Error changing subscription plan:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Change plan immediately by cancelling current and creating new
 */
async function changePlanImmediately(
    currentSubscription: any,
    newPlan: any
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
        // Cancel current CloudPayments subscription if exists
        if (currentSubscription.cloudpaymentsId) {
            const { cancelCloudPaymentsSubscription } = await import('./cloudpayments');
            await cancelCloudPaymentsSubscription(currentSubscription.cloudpaymentsId);
        }

        // Cancel current subscription
        await prisma.userSubscription.update({
            where: { id: currentSubscription.id },
            data: {
                status: SubscriptionStatus.cancelled,
                cancelledAt: new Date(),
                cancelReason: 'Plan changed immediately',
            },
        });

        // Create new subscription
        const newSubscription = await prisma.userSubscription.create({
            data: {
                userId: currentSubscription.userId,
                planId: newPlan.id,
                status: SubscriptionStatus.pending,
                startDate: new Date(),
                endDate: calculateSubscriptionEndDate(new Date(), newPlan.interval),
                nextBillingDate: calculateNextBillingDate(new Date(), newPlan.interval),
            },
        });

        return {
            success: true,
            subscriptionId: newSubscription.id,
        };
    } catch (error) {
        console.error('Error changing plan immediately:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Schedule plan change for end of current period
 */
async function schedulePlanChange(
    currentSubscription: any,
    newPlan: any
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
        // Update current subscription with next plan info
        await prisma.userSubscription.update({
            where: { id: currentSubscription.id },
            data: {
                nextPlanId: newPlan.id,
                nextPlanStartDate: currentSubscription.endDate,
            },
        });

        let futureSubscription = await prisma.userSubscription.findFirst({
            where: {
                userId: currentSubscription.userId,
                planId: newPlan.id,
                status: SubscriptionStatus.pending,
            },
        });

        if (!futureSubscription) {
            // Create future subscription record
            futureSubscription = await prisma.userSubscription.create({
                data: {
                    userId: currentSubscription.userId,
                    planId: newPlan.id,
                    status: SubscriptionStatus.pending,
                    startDate: currentSubscription.endDate,
                    endDate: calculateSubscriptionEndDate(currentSubscription.endDate, newPlan.interval),
                    nextBillingDate: calculateNextBillingDate(currentSubscription.endDate, newPlan.interval),
                },
            });
        }
        // Create CloudPayments subscription with future start date
        const { createCloudPaymentsSubscription } = await import('./cloudpayments');
        const receipt = generateSubscriptionReceipt(newPlan, undefined);

        const cloudPaymentsResult = await createCloudPaymentsSubscription({
            amount: newPlan.price,
            currency: newPlan.currency,
            interval: newPlan.interval,
            startDate: currentSubscription.endDate,
            accountId: currentSubscription.userId,
            description: `Подписка ${newPlan.name}`,
            receipt,
        });

        if (cloudPaymentsResult.success && cloudPaymentsResult.subscriptionId) {
            // Update future subscription with CloudPayments ID
            await prisma.userSubscription.update({
                where: { id: futureSubscription.id },
                data: {
                    cloudpaymentsId: cloudPaymentsResult.subscriptionId,
                },
            });
        }

        return {
            success: true,
            subscriptionId: futureSubscription.id,
        };
    } catch (error) {
        console.error('Error scheduling plan change:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Resume cancelled subscription
 */
export async function resumeSubscription(
    userId: string,
    subscriptionId: string,
    planId?: string
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
        // Find cancelled or expired subscription
        const cancelledSubscription = await prisma.userSubscription.findFirst({
            where: {
                userId,
                status: {
                    in: [SubscriptionStatus.cancelled, SubscriptionStatus.expired],
                },
            },
            include: {
                plan: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!cancelledSubscription) {
            return {
                success: false,
                error: 'No cancelled subscription found',
            };
        }

        // If no plan specified, use the same plan
        const targetPlanId = planId || cancelledSubscription.planId;
        const targetPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: targetPlanId, isActive: true },
        });

        if (!targetPlan) {
            return {
                success: false,
                error: 'Subscription plan not found',
            };
        }

        // Create new subscription
        // const newSubscription = await prisma.userSubscription.create({
        //     data: {
        //         userId: cancelledSubscription.userId,
        //         planId: targetPlan.id,
        //         status: SubscriptionStatus.pending,
        //         startDate: new Date(),
        //         endDate: calculateSubscriptionEndDate(new Date(), targetPlan.interval),
        //         nextBillingDate: calculateNextBillingDate(new Date(), targetPlan.interval),
        //     },
        // });

        const authToken = Buffer.from(
            `${process.env.CLOUDPAYMENTS_PUBLIC_ID}:${process.env.CLOUDPAYMENTS_SECRET_KEY}`
        ).toString('base64');

        const response = await fetch(`https://api.cloudpayments.ru/subscriptions/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${authToken}`,
            },
            body: JSON.stringify({
                Id: cancelledSubscription.cloudpaymentsId,
                description: 'Возобновление подписки',
            }),
        });

        const data = await response.json();
        if (data.Success) {
            //        Find the subscription and verify ownership
            console.log('Subscription resumed successfully', data);
            await prisma.userSubscription.update({
                where: { id: subscriptionId },
                data: { status: SubscriptionStatus.active },
            });
        } else {
            return {
                success: false,
                error: 'Failed to resume subscription',
            };
        }

        // await prisma.userSubscription.update({
        //     where: { id: subscriptionId },
        //     data: {
        //         status: SubscriptionStatus.active,
        //     },
        // });

        return {
            success: true,
            subscriptionId: subscriptionId,
        };
    } catch (error) {
        console.error('Error resuming subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Create a new subscription for a user
 */
export async function createSubscription(
    userId: string,
    planId: string
): Promise<{ success: boolean; subscriptionId?: string; paymentData?: any; error?: string }> {
    try {
        // Get the plan
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId, isActive: true },
        });

        if (!plan) {
            return {
                success: false,
                error: 'Subscription plan not found',
            };
        }

        // Create subscription record
        const subscription = await prisma.userSubscription.create({
            data: {
                userId,
                planId: plan.id,
                status: SubscriptionStatus.pending,
                startDate: new Date(),
                endDate: new Date(), // Will be updated after successful payment
                nextBillingDate: new Date(), // Will be updated after successful payment
            },
        });

        // Create initial payment record
        await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                amount: plan.price,
                currency: plan.currency,
                status: 'pending',
                billingStart: new Date(),
            },
        });

        // Get CloudPayments recurrent configuration
        const recurrentConfig = getCloudPaymentsInterval(plan.interval);

        // Calculate start date for recurrent payments (next billing cycle)
        const nextBillingDate = calculateSubscriptionEndDate(new Date(), plan.interval);

        // Generate receipt for CloudPayments
        const receipt = generateSubscriptionReceipt(plan, undefined);

        const paymentData = {
            subscriptionId: subscription.id,
            amount: plan.price.toString(),
            currency: plan.currency,
            description: `Подписка ${plan.name}`,
            cloudpaymentsData: {
                publicId: process.env.CLOUDPAYMENTS_PUBLIC_ID!,
                description: `Подписка ${plan.name}`,
                amount: plan.price,
                currency: plan.currency,
                invoiceId: subscription.id,
                accountId: userId,
                skin: 'modern',
                data: {
                    subscriptionId: subscription.id,
                    planId: plan.id,
                    userId: userId,
                },
            },
            recurrentData: {
                period: recurrentConfig.period,
                interval: recurrentConfig.interval,
                amount: plan.price,
                startDate: nextBillingDate.toISOString(),
                maxPeriods: undefined,
                receipt,
            },
        };

        return {
            success: true,
            subscriptionId: subscription.id,
            paymentData,
        };
    } catch (error) {
        console.error('Error creating subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

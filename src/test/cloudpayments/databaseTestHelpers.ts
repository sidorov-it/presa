import { prisma } from '@/lib/prisma';
import { PurchaseStatus, SubscriptionStatus } from '@prisma/client';

export interface TestUser {
    id: string;
    email: string;
    name: string;
}

export interface TestTokenPackage {
    id: string;
    packageType: string;
    name: string;
    tokens: number;
    price: number;
    currency: string;
}

export interface TestSubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'monthly' | 'quarterly' | 'semiannual' | 'daily';
    features: string[];
}

export interface TestTokenPurchase {
    id: string;
    userId: string;
    packageId: string;
    tokensAmount: number;
    price: number;
    currency: string;
    status: PurchaseStatus;
}

export interface TestSubscription {
    id: string;
    userId: string;
    planId: string;
    status: SubscriptionStatus;
    cloudpaymentsId?: string;
}

/**
 * Creates a test user
 */
export async function createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    const userData = {
        email: `test-user-${Date.now()}@example.com`,
        name: `Test User ${Date.now()}`,
        passwordHash: 'test-password-hash',
        role: 'user',
        isVerified: true,
        emailPreferences: { emailUpdates: true },
        createdVia: 'email' as const,
        ...overrides,
    };

    const user = await prisma.user.create({
        data: userData,
    });

    return {
        id: user.id,
        email: user.email,
        name: user.name || 'Test User',
    };
}

/**
 * Creates a test token package
 */
export async function createTestTokenPackage(overrides: Partial<TestTokenPackage> = {}): Promise<TestTokenPackage> {
    const packageData = {
        packageType: `test_package_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        name: `Test Package ${Date.now()}`,
        tokens: 1000,
        price: 99,
        currency: 'RUB',
        isActive: true,
        ...overrides,
    };

    const tokenPackage = await prisma.tokenPackage.create({
        data: packageData,
    });

    return {
        id: tokenPackage.id,
        packageType: tokenPackage.packageType,
        name: tokenPackage.name,
        tokens: tokenPackage.tokens,
        price: tokenPackage.price,
        currency: tokenPackage.currency,
    };
}

/**
 * Creates a test subscription plan
 */
export async function createTestSubscriptionPlan(
    overrides: Partial<TestSubscriptionPlan> = {}
): Promise<TestSubscriptionPlan> {
    const planData = {
        name: `Test Plan ${Date.now()}`,
        price: 299,
        currency: 'RUB',
        interval: 'monthly' as const,
        features: ['Feature 1', 'Feature 2'],
        isActive: true,
        ...overrides,
    };

    const plan = await prisma.subscriptionPlan.create({
        data: planData,
    });

    return {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features as string[],
    };
}

/**
 * Creates a test token purchase
 */
export async function createTestTokenPurchase(
    userId: string,
    packageId: string,
    overrides: Partial<TestTokenPurchase> = {}
): Promise<TestTokenPurchase> {
    const tokenPackage = await prisma.tokenPackage.findUnique({
        where: { id: packageId },
    });

    if (!tokenPackage) {
        throw new Error(`Token package ${packageId} not found`);
    }

    const purchaseData = {
        userId,
        packageId,
        tokensAmount: tokenPackage.tokens,
        price: tokenPackage.price,
        currency: tokenPackage.currency,
        status: PurchaseStatus.pending,
        paymentProvider: 'cloudpayments',
        ...overrides,
    };

    const purchase = await prisma.tokenPurchase.create({
        data: purchaseData,
    });

    return {
        id: purchase.id,
        userId: purchase.userId,
        packageId: purchase.packageId,
        tokensAmount: purchase.tokensAmount,
        price: purchase.price,
        currency: purchase.currency,
        status: purchase.status,
    };
}

/**
 * Creates a test subscription
 */
export async function createTestSubscription(
    userId: string,
    planId: string,
    overrides: Partial<TestSubscription> = {}
): Promise<TestSubscription> {
    const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
    });

    if (!plan) {
        throw new Error(`Subscription plan ${planId} not found`);
    }

    const subscriptionData = {
        userId,
        planId,
        status: SubscriptionStatus.pending,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ...overrides,
    };

    const subscription = await prisma.userSubscription.create({
        data: subscriptionData,
    });

    return {
        id: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        status: subscription.status,
        cloudpaymentsId: subscription.cloudpaymentsId || undefined,
    };
}

/**
 * Gets user's token balance
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
    const balance = await prisma.userTokens.findUnique({
        where: { userId },
    });

    return balance?.balance || 0;
}

/**
 * Gets user's token transactions
 */
export async function getUserTokenTransactions(userId: string) {
    return prisma.tokenTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Cleanup test data
 */
export async function cleanupTestData(testIds: {
    userIds?: string[];
    packageIds?: string[];
    planIds?: string[];
    purchaseIds?: string[];
    subscriptionIds?: string[];
}) {
    const { userIds = [], packageIds = [], planIds = [], purchaseIds = [], subscriptionIds = [] } = testIds;

    // Clean up in reverse dependency order
    if (purchaseIds.length > 0) {
        await prisma.tokenPurchase.deleteMany({
            where: { id: { in: purchaseIds } },
        });
    }

    if (subscriptionIds.length > 0) {
        // Clean up subscription payments first
        await prisma.subscriptionPayment.deleteMany({
            where: { subscriptionId: { in: subscriptionIds } },
        });

        await prisma.userSubscription.deleteMany({
            where: { id: { in: subscriptionIds } },
        });
    }

    if (userIds.length > 0) {
        // Clean up user-related data
        await prisma.tokenTransaction.deleteMany({
            where: { userId: { in: userIds } },
        });

        await prisma.userTokens.deleteMany({
            where: { userId: { in: userIds } },
        });

        await prisma.user.deleteMany({
            where: { id: { in: userIds } },
        });
    }

    if (packageIds.length > 0) {
        await prisma.tokenPackage.deleteMany({
            where: { id: { in: packageIds } },
        });
    }

    if (planIds.length > 0) {
        await prisma.subscriptionPlan.deleteMany({
            where: { id: { in: planIds } },
        });
    }
}

/**
 * Sets up a complete test scenario with user, package, and purchase
 */
export async function setupTokenPurchaseTestScenario() {
    const user = await createTestUser();
    const tokenPackage = await createTestTokenPackage();
    const purchase = await createTestTokenPurchase(user.id, tokenPackage.id);

    return {
        user,
        tokenPackage,
        purchase,
        cleanup: () =>
            cleanupTestData({
                userIds: [user.id],
                packageIds: [tokenPackage.id],
                purchaseIds: [purchase.id],
            }),
    };
}

/**
 * Sets up a complete test scenario with user, plan, and subscription
 */
export async function setupSubscriptionTestScenario() {
    const user = await createTestUser();
    const plan = await createTestSubscriptionPlan();
    const subscription = await createTestSubscription(user.id, plan.id, {
        cloudpaymentsId: `cp_sub_${Date.now()}`,
    });

    return {
        user,
        plan,
        subscription,
        cleanup: () =>
            cleanupTestData({
                userIds: [user.id],
                planIds: [plan.id],
                subscriptionIds: [subscription.id],
            }),
    };
}

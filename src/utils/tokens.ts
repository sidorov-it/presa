import { prisma } from '@/lib/prisma';
import { TransactionType, PurchaseStatus } from '@prisma/client';
import { TokenUsageData } from '@/types/tokens';

/**
 * Get user's current token balance
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
    const userTokens = await prisma.userTokens.findUnique({
        where: { userId },
    });

    return userTokens?.balance || 0;
}

/**
 * Create or update user tokens record
 */
export async function ensureUserTokensRecord(userId: string) {
    const existingRecord = await prisma.userTokens.findUnique({
        where: { userId },
    });

    if (!existingRecord) {
        await prisma.userTokens.create({
            data: {
                userId,
                balance: 0,
                totalUsed: 0,
            },
        });
    }

    return existingRecord;
}

/**
 * Deduct tokens for LLM requests
 */
export async function deductTokens(data: TokenUsageData): Promise<boolean> {
    const { userId, amount, description, llmRequestId, metadata } = data;

    // Start transaction
    return await prisma.$transaction(async (tx: any) => {
        // Get current balance
        const userTokens = await tx.userTokens.findUnique({
            where: { userId },
        });

        if (!userTokens || userTokens.balance < amount) {
            throw new Error('Insufficient token balance');
        }

        const balanceBefore = userTokens.balance;
        const balanceAfter = balanceBefore - amount;

        // Update user tokens
        await tx.userTokens.update({
            where: { userId },
            data: {
                balance: balanceAfter,
                totalUsed: userTokens.totalUsed + amount,
            },
        });

        // Create transaction record
        await tx.tokenTransaction.create({
            data: {
                userId,
                amount: -amount, // Negative for usage
                type: TransactionType.usage,
                description,
                llmRequestId,
                balanceBefore,
                balanceAfter,
                metadata,
            },
        });

        return true;
    });
}

/**
 * Add tokens to user balance (after successful purchase)
 */
export async function addTokens(
    userId: string,
    amount: number,
    type: TransactionType = TransactionType.purchase,
    description: string,
    purchaseId?: string,
    metadata?: any
): Promise<void> {
    await prisma.$transaction(async (tx: any) => {
        // Ensure user tokens record exists
        let userTokens = await tx.userTokens.findUnique({
            where: { userId },
        });

        if (!userTokens) {
            userTokens = await tx.userTokens.create({
                data: {
                    userId,
                    balance: 0,
                    totalUsed: 0,
                },
            });
        }

        const balanceBefore = userTokens.balance;
        const balanceAfter = balanceBefore + amount;

        // Update user tokens
        await tx.userTokens.update({
            where: { userId },
            data: {
                balance: balanceAfter,
            },
        });

        // Create transaction record
        await tx.tokenTransaction.create({
            data: {
                userId,
                amount,
                type,
                description,
                purchaseId,
                balanceBefore,
                balanceAfter,
                metadata,
            },
        });
    });
}

/**
 * Get user's token transaction history
 */
export async function getUserTokenTransactions(userId: string, limit = 20) {
    return await prisma.tokenTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Get all available token packages
 */
export async function getTokenPackages() {
    return await prisma.tokenPackage.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
    });
}

/**
 * Create a token purchase record
 */
export async function createTokenPurchase(
    userId: string,
    packageId: string,
    sessionId?: string,
    paymentProvider = 'stripe'
) {
    const tokenPackage = await prisma.tokenPackage.findUnique({
        where: { id: packageId },
    });

    if (!tokenPackage) {
        throw new Error('Token package not found');
    }

    return await prisma.tokenPurchase.create({
        data: {
            userId,
            packageId,
            tokensAmount: tokenPackage.tokens,
            price: tokenPackage.price,
            currency: tokenPackage.currency,
            status: PurchaseStatus.pending,
            paymentProvider,
            sessionId,
        },
    });
}

/**
 * Complete a token purchase
 */
export async function completeTokenPurchase(purchaseId: string, paymentId: string, metadata?: any) {
    const purchase = await prisma.tokenPurchase.findUnique({
        where: { id: purchaseId },
        include: { package: true },
    });

    if (!purchase) {
        throw new Error('Purchase not found');
    }

    // Update purchase status
    await prisma.tokenPurchase.update({
        where: { id: purchaseId },
        data: {
            status: PurchaseStatus.completed,
            paymentId,
            completedAt: new Date(),
            metadata,
        },
    });

    // Add tokens to user balance
    await addTokens(
        purchase.userId,
        purchase.tokensAmount,
        TransactionType.purchase,
        `Purchased ${purchase.package?.name} package`,
        purchaseId,
        metadata
    );
}

/**
 * Check if user has sufficient tokens
 */
export async function hasEnoughTokens(userId: string, requiredTokens: number): Promise<boolean> {
    const balance = await getUserTokenBalance(userId);
    return balance >= requiredTokens;
}

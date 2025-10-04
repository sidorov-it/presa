import { PurchaseStatus, TransactionType } from '@prisma/client';

export interface UserTokenBalance {
    id: string;
    userId: string;
    balance: number;
    totalUsed: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface TokenPackage {
    id: string;
    name: string;
    description?: string | null;
    tokens: number;
    price: number;
    currency: string;
    isActive: boolean;
    isPopular: boolean;
    // createdAt: Date;
    // updatedAt: Date;
}

export interface TokenPurchase {
    id: string;
    userId: string;
    packageId: string;
    tokensAmount: number;
    price: number;
    currency: string;
    status: PurchaseStatus;
    paymentProvider?: string;
    paymentId?: string;
    sessionId?: string;
    purchasedAt: Date;
    completedAt?: Date;
    metadata?: any;
    package?: TokenPackage;
}

export interface TokenTransaction {
    id: string;
    userId: string;
    amount: number;
    type: TransactionType;
    description: string;
    purchaseId?: string;
    llmRequestId?: string | null;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: Date;
    metadata?: any;
}

export interface CreateTokenPurchaseData {
    packageId: string;
    paymentProvider: string;
    sessionId?: string;
}

export interface TokenUsageData {
    userId: string;
    amount: number;
    description: string;
    llmRequestId?: string | null;
    metadata?: any;
}

// Client-side types for components
export interface TokenPackageCardProps {
    package: TokenPackage;
    onPurchase: (packageId: string) => void;
    isLoading?: boolean;
}

export interface TokenBalanceDisplayProps {
    balance: number;
    className?: string;
}

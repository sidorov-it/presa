import { SubscriptionInterval, SubscriptionStatus, PurchaseStatus } from '@prisma/client';

export interface SubscriptionPlan {
    id: string;
    name: string;
    description?: string;
    interval: SubscriptionInterval;
    price: number;
    currency: string;
    isActive: boolean;
    isPopular: boolean;
    features?: SubscriptionFeatures;
    createdAt: Date;
    updatedAt: Date;
}

export interface SubscriptionFeatures {
    maxSlides: number;
    hideBranding: boolean;
    maxDocumentSize: number; // in MB
    priority: boolean;
    customExport: boolean;
}

export interface UserSubscription {
    id: string;
    userId: string;
    planId: string;
    plan?: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    nextBillingDate?: Date;
    cloudpaymentsId?: string;
    lastPaymentId?: string;
    cancelledAt?: Date;
    cancelReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SubscriptionPayment {
    id: string;
    subscriptionId: string;
    subscription?: UserSubscription;
    amount: number;
    currency: string;
    status: PurchaseStatus;
    cloudpaymentsId?: string;
    paymentMethod?: string;
    billingStart: Date;
    billingEnd: Date;
    createdAt: Date;
    completedAt?: Date;
    metadata?: Record<string, any>;
}

export interface CreateSubscriptionRequest {
    planId: string;
    returnUrl?: string;
}

export interface CreateSubscriptionResponse {
    success: boolean;
    subscriptionId: string;
    amount: number;
    currency: string;
    description: string;
    cloudpaymentsData?: {
        publicId: string;
        invoiceId: string;
        accountId: string;
    };
}

export interface SubscriptionStatusResponse {
    hasActiveSubscription: boolean;
    subscription?: UserSubscription;
    features?: SubscriptionFeatures;
}

export interface SubscriptionWebhookData {
    TransactionId: string;
    Amount: string;
    Currency: string;
    OperationType: string;
    InvoiceId: string;
    AccountId: string;
    Status: string;
    Description: string;
    TestMode: string;
    Data: string;
    DateTime: string;
    SubscriptionId?: string;
    RecurrenceType?: string;
} 
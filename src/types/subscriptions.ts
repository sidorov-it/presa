import { SubscriptionInterval, SubscriptionStatus } from '@prisma/client';

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    interval: SubscriptionInterval;
    price: number;
    currency: string;
    isActive: boolean;
    isPopular?: boolean;
    features: SubscriptionFeatures;
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
    amount: number;
    currency: string;
    status: string;
    cloudpaymentsId?: string;
    paymentMethod?: string;
    billingStart?: Date;
    billingEnd?: Date;
    createdAt: Date;
}

export interface CreateSubscriptionRequest {
    planId: string;
}

export interface CreateSubscriptionResponse {
    success: boolean;
    subscriptionId?: string;
    paymentData?: {
        subscriptionId: string;
        amount: string;
        currency: string;
        description: string;
        cloudpaymentsData: CloudPaymentsSubscriptionData;
        recurrentData: CloudPaymentsRecurrentData;
    };
    error?: string;
}

export interface CloudPaymentsSubscriptionData {
    publicId: string;
    description: string;
    amount: number;
    currency: string;
    invoiceId: string;
    accountId: string;
    skin: string;
    data: {
        subscriptionId: string;
        planId: string;
        userId: string;
    };
}

export interface CloudPaymentsRecurrentData {
    period: number;
    interval: 'Day' | 'Week' | 'Month';
    amount: number;
    startDate: string;
    maxPeriods?: number;
    receipt: {
        items: Array<{
            label: string;
            price: number;
            quantity: number;
            amount: number;
            vat: number;
            method: number;
            object: number;
        }>;
        taxationSystem: number;
        email?: string;
        phone?: string;
        isBso: boolean;
        amounts: {
            electronic: number;
            advancePayment: number;
            credit: number;
            provision: number;
        };
    };
}

export interface SubscriptionStatusResponse {
    hasActiveSubscription: boolean;
    subscription?: UserSubscription;
    features: SubscriptionFeatures;
}

export interface SubscriptionWebhookData {
    TransactionId: string;
    Amount: string;
    Currency: string;
    DateTime: string;
    CardFirstSix?: string;
    CardLastFour?: string;
    CardType?: string;
    CardExpDate?: string;
    TestMode: string;
    Status: string;
    OperationType?: string;
    InvoiceId?: string;
    AccountId?: string;
    SubscriptionId?: string;
    Name?: string;
    Email?: string;
    Data?: string;
    Token?: string;
    TotalFee?: string;
    RecurrenceType?: 'Init' | 'Auto';
}

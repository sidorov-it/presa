import { CloudPaymentsWebhookData, CloudPaymentsRecurrentWebhookData } from '@/lib/cloudpayments/parseWebhookPayload';

// Helper function to generate MongoDB ObjectID-like strings for testing
function generateObjectId(): string {
    const timestamp = Math.floor(Date.now() / 1000)
        .toString(16)
        .padStart(8, '0');
    const randomPart = Math.random().toString(16).substring(2, 10);
    const counter = Math.floor(Math.random() * 16777216)
        .toString(16)
        .padStart(6, '0');
    return timestamp + randomPart + counter;
}

// Helper function to generate a valid but non-existent ObjectID for testing
function generateNonExistentObjectId(): string {
    // Use a timestamp from the past to ensure it's not used
    const timestamp = Math.floor((Date.now() - 1000000000) / 1000)
        .toString(16)
        .padStart(8, '0');
    const randomPart = 'deadbeef00'; // Use a fixed value to make it predictable (10 chars)
    const counter = '000000';
    return timestamp + randomPart + counter;
}

// Mock NextRequest for testing environment
class MockNextRequest {
    method: string;
    url: string;
    body: FormData;
    formData: () => Promise<FormData>;

    constructor(url: string, options: { method: string; body: FormData }) {
        this.method = options.method;
        this.url = url;
        this.body = options.body;
        this.formData = () => Promise.resolve(options.body);
    }
}

export interface TokenPurchaseTestData {
    purchaseId: string;
    userId: string;
    packageId: string;
    amount: number;
    currency: string;
    transactionId?: string;
    status?: 'Completed' | 'Declined' | 'Authorized';
    testMode?: boolean;
}

export interface SubscriptionTestData {
    userSubscriptionId: string;
    userId: string;
    planId: string;
    amount: number;
    currency: string;
    transactionId?: string;
    status?: 'Completed' | 'Declined' | 'Authorized';
    testMode?: boolean;
    cloudpaymentsId?: string;
}

export interface RecurrentNotificationTestData {
    cloudpaymentsId: string;
    userId: string;
    status: 'Active' | 'PastDue' | 'Cancelled' | 'Rejected' | 'Expired' | 'Scheduled';
    amount: number;
    currency: string;
    successfulTransactions?: number;
    failedTransactions?: number;
    lastTransactionDate?: string;
    nextTransactionDate?: string;
    testMode?: boolean;
}

/**
 * Creates a mock NextRequest for CloudPayments webhook testing
 */
export function createMockWebhookRequest(
    webhookData: CloudPaymentsWebhookData,
    additionalData?: Record<string, any>
): MockNextRequest {
    const formData = new FormData();

    // Add all webhook data fields to form data
    Object.entries(webhookData).forEach(([key, value]) => {
        if (value !== undefined) {
            formData.append(key, String(value));
        }
    });

    // Add additional data as JSON in Data field if provided
    if (additionalData) {
        formData.set('Data', JSON.stringify(additionalData));
    }

    const request = new MockNextRequest('http://localhost:3000/api/webhooks/cloudpayments/test', {
        method: 'POST',
        body: formData,
    });

    return request;
}

/**
 * Creates webhook data for token purchase notifications
 */
export function createTokenPurchaseWebhookData(testData: TokenPurchaseTestData): {
    webhookData: CloudPaymentsWebhookData;
    additionalData: Record<string, any>;
} {
    const transactionId = testData.transactionId || generateObjectId();
    const status = testData.status || 'Completed';
    const testMode = testData.testMode !== false ? '1' : '0';

    // Use the provided purchaseId or generate a proper ObjectID for non-existent cases
    const purchaseId = testData.purchaseId.startsWith('non-existent')
        ? generateNonExistentObjectId()
        : testData.purchaseId;

    const webhookData: CloudPaymentsWebhookData = {
        TransactionId: transactionId,
        Amount: String(testData.amount),
        Currency: testData.currency,
        PaymentAmount: String(testData.amount),
        PaymentCurrency: testData.currency,
        OperationType: 'Payment',
        InvoiceId: purchaseId,
        AccountId: testData.userId,
        Status: status,
        Description: `Token purchase: Package ${testData.packageId}`,
        TestMode: testMode,
        Data: '',
        DateTime: new Date().toISOString(),
    };

    const additionalData = {
        packageId: testData.packageId,
        userId: testData.userId,
        testPurchase: testData.testMode !== false,
    };

    return { webhookData, additionalData };
}

/**
 * Creates webhook data for subscription payment notifications
 */
export function createSubscriptionWebhookData(testData: SubscriptionTestData): {
    webhookData: CloudPaymentsWebhookData;
    additionalData: Record<string, any>;
} {
    const transactionId = testData.transactionId || generateObjectId();
    const status = testData.status || 'Completed';
    const testMode = testData.testMode !== false ? '1' : '0';
    const cloudpaymentsId = testData.cloudpaymentsId || generateObjectId();

    const webhookData: CloudPaymentsWebhookData = {
        TransactionId: transactionId,
        Amount: String(testData.amount),
        Currency: testData.currency,
        PaymentAmount: String(testData.amount),
        PaymentCurrency: testData.currency,
        OperationType: 'Payment',
        InvoiceId: testData.userSubscriptionId,
        AccountId: testData.userId,
        Status: status,
        Description: `Subscription payment: Plan ${testData.planId}`,
        TestMode: testMode,
        Data: '',
        DateTime: new Date().toISOString(),
        SubscriptionId: cloudpaymentsId,
        RecurrenceType: 'Init',
    };

    const additionalData = {
        userSubscriptionId: testData.userSubscriptionId,
        planId: testData.planId,
        userId: testData.userId,
        testSubscription: testData.testMode !== false,
    };

    return { webhookData, additionalData };
}

/**
 * Creates recurrent notification webhook data
 */
export function createRecurrentWebhookData(testData: RecurrentNotificationTestData): CloudPaymentsRecurrentWebhookData {
    return {
        Id: testData.cloudpaymentsId,
        AccountId: testData.userId,
        Description: `Subscription recurring payment`,
        Email: `test-user-${testData.userId}@example.com`,
        Amount: testData.amount,
        Currency: testData.currency,
        RequireConfirmation: false,
        StartDate: new Date().toISOString(),
        Interval: 'Month',
        Period: 1,
        Status: testData.status,
        SuccessfulTransactionsNumber: testData.successfulTransactions || 0,
        FailedTransactionsNumber: testData.failedTransactions || 0,
        LastTransactionDate: testData.lastTransactionDate,
        NextTransactionDate: testData.nextTransactionDate,
    };
}

/**
 * Creates a mock NextRequest for recurrent notifications
 */
export function createMockRecurrentRequest(recurrentData: CloudPaymentsRecurrentWebhookData): MockNextRequest {
    const formData = new FormData();

    // Add all recurrent data fields to form data
    Object.entries(recurrentData).forEach(([key, value]) => {
        if (value !== undefined) {
            formData.append(key, String(value));
        }
    });

    const request = new MockNextRequest('http://localhost:3000/api/webhooks/cloudpayments/recurrent', {
        method: 'POST',
        body: formData,
    });

    return request;
}

/**
 * Creates webhook data for failed payments
 */
export function createFailedPaymentWebhookData(testData: TokenPurchaseTestData | SubscriptionTestData): {
    webhookData: CloudPaymentsWebhookData;
    additionalData: Record<string, any>;
} {
    const isSubscription = 'planId' in testData;
    const baseData = isSubscription
        ? createSubscriptionWebhookData(testData as SubscriptionTestData)
        : createTokenPurchaseWebhookData(testData as TokenPurchaseTestData);

    // Override status to indicate failure
    baseData.webhookData.Status = 'Declined';

    return baseData;
}

/**
 * Helper to simulate CloudPayments check notification
 */
export function createCheckWebhookData(testData: SubscriptionTestData): {
    webhookData: CloudPaymentsWebhookData;
    additionalData: Record<string, any>;
} {
    const { webhookData, additionalData } = createSubscriptionWebhookData(testData);

    // Check notifications typically have different operation type
    webhookData.OperationType = 'Check';
    webhookData.Status = 'Authorized';

    return { webhookData, additionalData };
}

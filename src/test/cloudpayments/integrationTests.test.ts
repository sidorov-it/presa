import { describe, test, expect } from '@jest/globals';
import { PurchaseStatus, SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Import handlers
import * as checkHandler from '@/lib/cloudpayments/handlers/check';
import * as payHandler from '@/lib/cloudpayments/handlers/pay';
import * as failHandler from '@/lib/cloudpayments/handlers/fail';
import * as recurrentHandler from '@/lib/cloudpayments/handlers/recurrent';

// Import test utilities
import {
    createMockWebhookRequest,
    createTokenPurchaseWebhookData,
    createSubscriptionWebhookData,
    createMockRecurrentRequest,
    createRecurrentWebhookData,
    createFailedPaymentWebhookData,
    TokenPurchaseTestData,
    SubscriptionTestData,
    RecurrentNotificationTestData,
} from './webhookTestUtils';
import {
    setupTokenPurchaseTestScenario,
    setupSubscriptionTestScenario,
    createTestUser,
    createTestTokenPackage,
    createTestSubscriptionPlan,
    createTestTokenPurchase,
    createTestSubscription,
    getUserTokenBalance,
    getUserTokenTransactions,
    cleanupTestData,
} from './databaseTestHelpers';

describe('CloudPayments Integration Tests', () => {
    describe('Cross-Platform Payment Processing', () => {
        test('should handle simultaneous token purchase and subscription payments for same user', async () => {
            // Setup user with both token purchase and subscription
            const user = await createTestUser();
            const tokenPackage = await createTestTokenPackage();
            const subscriptionPlan = await createTestSubscriptionPlan();

            const tokenPurchase = await createTestTokenPurchase(user.id, tokenPackage.id);
            const subscription = await createTestSubscription(user.id, subscriptionPlan.id, {
                cloudpaymentsId: `cp_sub_${Date.now()}`,
            });

            try {
                // Process token purchase payment
                const tokenTestData: TokenPurchaseTestData = {
                    purchaseId: tokenPurchase.id,
                    userId: user.id,
                    packageId: tokenPackage.id,
                    amount: tokenPackage.price,
                    currency: tokenPackage.currency,
                    status: 'Completed',
                    transactionId: 'token_tx_12345',
                };

                const { webhookData: tokenWebhookData, additionalData: tokenAdditionalData } =
                    createTokenPurchaseWebhookData(tokenTestData);
                const tokenRequest = createMockWebhookRequest(tokenWebhookData, tokenAdditionalData);

                const tokenResponse = await payHandler.POST(tokenRequest);
                expect(tokenResponse.status).toBe(200);

                // Process subscription payment
                const subscriptionTestData: SubscriptionTestData = {
                    subscriptionId: subscription.id,
                    userId: user.id,
                    planId: subscriptionPlan.id,
                    amount: subscriptionPlan.price,
                    currency: subscriptionPlan.currency,
                    cloudpaymentsId: subscription.cloudpaymentsId!,
                    status: 'Completed',
                    transactionId: 'sub_tx_12345',
                };

                const { webhookData: subWebhookData, additionalData: subAdditionalData } =
                    createSubscriptionWebhookData(subscriptionTestData);
                const subRequest = createMockWebhookRequest(subWebhookData, subAdditionalData);

                const subResponse = await payHandler.POST(subRequest);
                expect(subResponse.status).toBe(200);

                // Verify both payments were processed correctly
                const finalTokenPurchase = await prisma.tokenPurchase.findUnique({
                    where: { id: tokenPurchase.id },
                });
                expect(finalTokenPurchase?.status).toBe(PurchaseStatus.completed);

                const finalSubscription = await prisma.userSubscription.findUnique({
                    where: { id: subscription.id },
                });
                expect(finalSubscription?.status).toBe(SubscriptionStatus.active);

                // Verify tokens were added
                const tokenBalance = await getUserTokenBalance(user.id);
                expect(tokenBalance).toBe(tokenPackage.tokens);
            } finally {
                await cleanupTestData({
                    userIds: [user.id],
                    packageIds: [tokenPackage.id],
                    planIds: [subscriptionPlan.id],
                    purchaseIds: [tokenPurchase.id],
                    subscriptionIds: [subscription.id],
                });
            }
        });

        test('should handle webhook routing correctly for different payment types', async () => {
            const user = await createTestUser();
            const tokenPackage = await createTestTokenPackage();
            const subscriptionPlan = await createTestSubscriptionPlan();

            const tokenPurchase = await createTestTokenPurchase(user.id, tokenPackage.id);
            const subscription = await createTestSubscription(user.id, subscriptionPlan.id, {
                cloudpaymentsId: `cp_sub_${Date.now()}`,
            });

            try {
                // Test token purchase webhook (no SubscriptionId)
                const tokenTestData: TokenPurchaseTestData = {
                    purchaseId: tokenPurchase.id,
                    userId: user.id,
                    packageId: tokenPackage.id,
                    amount: tokenPackage.price,
                    currency: tokenPackage.currency,
                    status: 'Completed',
                };

                const { webhookData: tokenWebhookData, additionalData: tokenAdditionalData } =
                    createTokenPurchaseWebhookData(tokenTestData);

                // Ensure no SubscriptionId is present for token purchase
                expect(tokenWebhookData.SubscriptionId).toBeUndefined();

                const tokenRequest = createMockWebhookRequest(tokenWebhookData, tokenAdditionalData);
                const tokenResponse = await payHandler.POST(tokenRequest);
                expect(tokenResponse.status).toBe(200);

                // Test subscription webhook (with SubscriptionId)
                const subscriptionTestData: SubscriptionTestData = {
                    subscriptionId: subscription.id,
                    userId: user.id,
                    planId: subscriptionPlan.id,
                    amount: subscriptionPlan.price,
                    currency: subscriptionPlan.currency,
                    cloudpaymentsId: subscription.cloudpaymentsId!,
                    status: 'Completed',
                };

                const { webhookData: subWebhookData, additionalData: subAdditionalData } =
                    createSubscriptionWebhookData(subscriptionTestData);

                // Ensure SubscriptionId is present for subscription
                expect(subWebhookData.SubscriptionId).toBe(subscription.cloudpaymentsId);

                const subRequest = createMockWebhookRequest(subWebhookData, subAdditionalData);
                const subResponse = await payHandler.POST(subRequest);
                expect(subResponse.status).toBe(200);

                // Verify correct processing
                const finalTokenPurchase = await prisma.tokenPurchase.findUnique({
                    where: { id: tokenPurchase.id },
                });
                expect(finalTokenPurchase?.status).toBe(PurchaseStatus.completed);

                const finalSubscription = await prisma.userSubscription.findUnique({
                    where: { id: subscription.id },
                });
                expect(finalSubscription?.status).toBe(SubscriptionStatus.active);
            } finally {
                await cleanupTestData({
                    userIds: [user.id],
                    packageIds: [tokenPackage.id],
                    planIds: [subscriptionPlan.id],
                    purchaseIds: [tokenPurchase.id],
                    subscriptionIds: [subscription.id],
                });
            }
        });
    });

    describe('Complete Payment Lifecycle Tests', () => {
        test('should handle complete token purchase lifecycle with all webhook types', async () => {
            const tokenScenario = await setupTokenPurchaseTestScenario();

            try {
                const testData: TokenPurchaseTestData = {
                    purchaseId: tokenScenario.purchase.id,
                    userId: tokenScenario.user.id,
                    packageId: tokenScenario.tokenPackage.id,
                    amount: tokenScenario.tokenPackage.price,
                    currency: tokenScenario.tokenPackage.currency,
                    transactionId: 'lifecycle_tx_12345',
                };

                // Step 1: Check webhook
                const checkData = { ...testData, status: 'Authorized' as const };
                const { webhookData: checkWebhookData, additionalData: checkAdditionalData } =
                    createTokenPurchaseWebhookData(checkData);
                const checkRequest = createMockWebhookRequest(checkWebhookData, checkAdditionalData);

                const checkResponse = await checkHandler.POST(checkRequest);
                expect(checkResponse.status).toBe(200);
                const checkResponseData = await checkResponse.json();
                expect(checkResponseData.code).toBe(0);

                // Verify purchase is still pending after check
                let purchase = await prisma.tokenPurchase.findUnique({
                    where: { id: tokenScenario.purchase.id },
                });
                expect(purchase?.status).toBe(PurchaseStatus.pending);

                // Step 2: Pay webhook
                const payData = { ...testData, status: 'Completed' as const };
                const { webhookData: payWebhookData, additionalData: payAdditionalData } =
                    createTokenPurchaseWebhookData(payData);
                const payRequest = createMockWebhookRequest(payWebhookData, payAdditionalData);

                const payResponse = await payHandler.POST(payRequest);
                expect(payResponse.status).toBe(200);
                const payResponseData = await payResponse.json();
                expect(payResponseData.code).toBe(0);

                // Verify purchase is completed and tokens added
                purchase = await prisma.tokenPurchase.findUnique({
                    where: { id: tokenScenario.purchase.id },
                });
                expect(purchase?.status).toBe(PurchaseStatus.completed);
                expect(purchase?.completedAt).toBeTruthy();

                const tokenBalance = await getUserTokenBalance(tokenScenario.user.id);
                expect(tokenBalance).toBe(tokenScenario.tokenPackage.tokens);

                const transactions = await getUserTokenTransactions(tokenScenario.user.id);
                expect(transactions).toHaveLength(1);
                expect(transactions[0].amount).toBe(tokenScenario.tokenPackage.tokens);
            } finally {
                await tokenScenario.cleanup();
            }
        });

        test('should handle complete subscription lifecycle with recurrent payments', async () => {
            const subScenario = await setupSubscriptionTestScenario();

            try {
                const testData: SubscriptionTestData = {
                    subscriptionId: subScenario.subscription.id,
                    userId: subScenario.user.id,
                    planId: subScenario.plan.id,
                    amount: subScenario.plan.price,
                    currency: subScenario.plan.currency,
                    cloudpaymentsId: subScenario.subscription.cloudpaymentsId!,
                    transactionId: 'sub_lifecycle_tx_12345',
                };

                // Step 1: Initial subscription payment (check -> pay)
                const checkData = { ...testData, status: 'Authorized' as const };
                const { webhookData: checkWebhookData, additionalData: checkAdditionalData } =
                    createSubscriptionWebhookData(checkData);
                const checkRequest = createMockWebhookRequest(checkWebhookData, checkAdditionalData);

                const checkResponse = await checkHandler.POST(checkRequest);
                expect(checkResponse.status).toBe(200);

                const payData = { ...testData, status: 'Completed' as const };
                const { webhookData: payWebhookData, additionalData: payAdditionalData } =
                    createSubscriptionWebhookData(payData);
                const payRequest = createMockWebhookRequest(payWebhookData, payAdditionalData);

                const payResponse = await payHandler.POST(payRequest);
                expect(payResponse.status).toBe(200);

                // Verify subscription is active
                let subscription = await prisma.userSubscription.findUnique({
                    where: { id: subScenario.subscription.id },
                });
                expect(subscription?.status).toBe(SubscriptionStatus.active);

                // Step 2: Simulate recurrent payment notifications over time
                const recurrentStatuses: Array<{
                    status: RecurrentNotificationTestData['status'];
                    expectedStatus: SubscriptionStatus;
                }> = [
                    { status: 'Active', expectedStatus: SubscriptionStatus.active },
                    { status: 'PastDue', expectedStatus: SubscriptionStatus.active }, // Still active but flagged
                    { status: 'Active', expectedStatus: SubscriptionStatus.active }, // Recovered
                ];

                for (let i = 0; i < recurrentStatuses.length; i++) {
                    const { status, expectedStatus } = recurrentStatuses[i];

                    const recurrentTestData: RecurrentNotificationTestData = {
                        cloudpaymentsId: subScenario.subscription.cloudpaymentsId!,
                        userId: subScenario.user.id,
                        status,
                        amount: subScenario.plan.price,
                        currency: subScenario.plan.currency,
                        successfulTransactions: i + 1,
                        failedTransactions: status === 'PastDue' ? 1 : 0,
                        nextTransactionDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    };

                    const recurrentData = createRecurrentWebhookData(recurrentTestData);
                    const recurrentRequest = createMockRecurrentRequest(recurrentData);

                    const recurrentResponse = await recurrentHandler.POST(recurrentRequest);
                    expect(recurrentResponse.status).toBe(200);

                    subscription = await prisma.userSubscription.findUnique({
                        where: { id: subScenario.subscription.id },
                    });
                    expect(subscription?.status).toBe(expectedStatus);

                    if (status === 'PastDue') {
                        expect(subscription?.metadata).toMatchObject({ pastDue: true });
                    }
                }

                // Step 3: Final cancellation
                const cancelRecurrentData: RecurrentNotificationTestData = {
                    cloudpaymentsId: subScenario.subscription.cloudpaymentsId!,
                    userId: subScenario.user.id,
                    status: 'Cancelled',
                    amount: subScenario.plan.price,
                    currency: subScenario.plan.currency,
                    successfulTransactions: 3,
                    failedTransactions: 1,
                };

                const cancelData = createRecurrentWebhookData(cancelRecurrentData);
                const cancelRequest = createMockRecurrentRequest(cancelData);

                const cancelResponse = await recurrentHandler.POST(cancelRequest);
                expect(cancelResponse.status).toBe(200);

                subscription = await prisma.userSubscription.findUnique({
                    where: { id: subScenario.subscription.id },
                });
                expect(subscription?.status).toBe(SubscriptionStatus.cancelled);
                expect(subscription?.cancelledAt).toBeTruthy();
            } finally {
                await subScenario.cleanup();
            }
        });
    });

    describe('Error Recovery and Resilience Tests', () => {
        test('should handle mixed success and failure scenarios', async () => {
            const user = await createTestUser();
            const tokenPackage1 = await createTestTokenPackage({ name: 'Package 1', tokens: 1000 });
            const tokenPackage2 = await createTestTokenPackage({ name: 'Package 2', tokens: 2000 });

            const purchase1 = await createTestTokenPurchase(user.id, tokenPackage1.id);
            const purchase2 = await createTestTokenPurchase(user.id, tokenPackage2.id);

            try {
                // First purchase succeeds
                const successTestData: TokenPurchaseTestData = {
                    purchaseId: purchase1.id,
                    userId: user.id,
                    packageId: tokenPackage1.id,
                    amount: tokenPackage1.price,
                    currency: tokenPackage1.currency,
                    status: 'Completed',
                };

                const { webhookData: successWebhookData, additionalData: successAdditionalData } =
                    createTokenPurchaseWebhookData(successTestData);
                const successRequest = createMockWebhookRequest(successWebhookData, successAdditionalData);

                const successResponse = await payHandler.POST(successRequest);
                expect(successResponse.status).toBe(200);

                // Second purchase fails
                const failTestData: TokenPurchaseTestData = {
                    purchaseId: purchase2.id,
                    userId: user.id,
                    packageId: tokenPackage2.id,
                    amount: tokenPackage2.price,
                    currency: tokenPackage2.currency,
                    status: 'Declined',
                };

                const { webhookData: failWebhookData, additionalData: failAdditionalData } =
                    createFailedPaymentWebhookData(failTestData);
                const failRequest = createMockWebhookRequest(failWebhookData, failAdditionalData);

                const failResponse = await failHandler.POST(failRequest);
                expect(failResponse.status).toBe(200);

                // Verify final states
                const finalPurchase1 = await prisma.tokenPurchase.findUnique({
                    where: { id: purchase1.id },
                });
                expect(finalPurchase1?.status).toBe(PurchaseStatus.completed);

                const finalPurchase2 = await prisma.tokenPurchase.findUnique({
                    where: { id: purchase2.id },
                });
                expect(finalPurchase2?.status).toBe(PurchaseStatus.failed);

                // Only tokens from successful purchase should be added
                const tokenBalance = await getUserTokenBalance(user.id);
                expect(tokenBalance).toBe(tokenPackage1.tokens);

                const transactions = await getUserTokenTransactions(user.id);
                expect(transactions).toHaveLength(1);
                expect(transactions[0].amount).toBe(tokenPackage1.tokens);
            } finally {
                await cleanupTestData({
                    userIds: [user.id],
                    packageIds: [tokenPackage1.id, tokenPackage2.id],
                    purchaseIds: [purchase1.id, purchase2.id],
                });
            }
        });

        test('should handle webhook replay attacks and duplicate processing', async () => {
            const tokenScenario = await setupTokenPurchaseTestScenario();

            try {
                const testData: TokenPurchaseTestData = {
                    purchaseId: tokenScenario.purchase.id,
                    userId: tokenScenario.user.id,
                    packageId: tokenScenario.tokenPackage.id,
                    amount: tokenScenario.tokenPackage.price,
                    currency: tokenScenario.tokenPackage.currency,
                    status: 'Completed',
                    transactionId: 'replay_attack_tx_12345',
                };

                const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);

                // Process the same webhook multiple times
                const requests = Array(5)
                    .fill(null)
                    .map(() => createMockWebhookRequest(webhookData, additionalData));

                const responses = await Promise.all(requests.map(request => payHandler.POST(request)));

                // All responses should be successful
                responses.forEach(response => {
                    expect(response.status).toBe(200);
                });

                // But tokens should only be added once
                const tokenBalance = await getUserTokenBalance(tokenScenario.user.id);
                expect(tokenBalance).toBe(tokenScenario.tokenPackage.tokens);

                const transactions = await getUserTokenTransactions(tokenScenario.user.id);
                expect(transactions).toHaveLength(1);

                // Purchase should be completed only once
                const finalPurchase = await prisma.tokenPurchase.findUnique({
                    where: { id: tokenScenario.purchase.id },
                });
                expect(finalPurchase?.status).toBe(PurchaseStatus.completed);
            } finally {
                await tokenScenario.cleanup();
            }
        });

        test('should handle concurrent webhook processing', async () => {
            const user = await createTestUser();
            const tokenPackages = await Promise.all([
                createTestTokenPackage({ name: 'Concurrent Package 1', tokens: 500 }),
                createTestTokenPackage({ name: 'Concurrent Package 2', tokens: 750 }),
                createTestTokenPackage({ name: 'Concurrent Package 3', tokens: 1000 }),
            ]);

            const purchases = await Promise.all(tokenPackages.map(pkg => createTestTokenPurchase(user.id, pkg.id)));

            try {
                // Process all purchases concurrently
                const webhookPromises = purchases.map((purchase, index) => {
                    const testData: TokenPurchaseTestData = {
                        purchaseId: purchase.id,
                        userId: user.id,
                        packageId: tokenPackages[index].id,
                        amount: tokenPackages[index].price,
                        currency: tokenPackages[index].currency,
                        status: 'Completed',
                        transactionId: `concurrent_tx_${index + 1}`,
                    };

                    const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
                    const request = createMockWebhookRequest(webhookData, additionalData);

                    return payHandler.POST(request);
                });

                const responses = await Promise.all(webhookPromises);

                // All should succeed
                responses.forEach(response => {
                    expect(response.status).toBe(200);
                });

                // All purchases should be completed
                const finalPurchases = await Promise.all(
                    purchases.map(purchase => prisma.tokenPurchase.findUnique({ where: { id: purchase.id } }))
                );

                finalPurchases.forEach(purchase => {
                    expect(purchase?.status).toBe(PurchaseStatus.completed);
                });

                // Total tokens should be sum of all packages
                const expectedTotalTokens = tokenPackages.reduce((sum, pkg) => sum + pkg.tokens, 0);
                const actualTokenBalance = await getUserTokenBalance(user.id);
                expect(actualTokenBalance).toBe(expectedTotalTokens);

                const transactions = await getUserTokenTransactions(user.id);
                expect(transactions).toHaveLength(3);
            } finally {
                await cleanupTestData({
                    userIds: [user.id],
                    packageIds: tokenPackages.map(pkg => pkg.id),
                    purchaseIds: purchases.map(purchase => purchase.id),
                });
            }
        });
    });

    describe('Performance and Load Tests', () => {
        test('should handle high volume of webhook notifications efficiently', async () => {
            const user = await createTestUser();
            const tokenPackage = await createTestTokenPackage({ tokens: 100 }); // Small package for volume test
            const purchase = await createTestTokenPurchase(user.id, tokenPackage.id);

            // Create 20 webhook requests for the same purchase (simulating high volume)
            const webhookRequests = Array.from({ length: 20 }, (_, index) => {
                const testData: TokenPurchaseTestData = {
                    purchaseId: purchase.id,
                    userId: user.id,
                    packageId: tokenPackage.id,
                    amount: tokenPackage.price,
                    currency: tokenPackage.currency,
                    status: 'Completed',
                    transactionId: `high_volume_tx_${index}`,
                };

                const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
                return createMockWebhookRequest(webhookData, additionalData);
            });

            const startTime = Date.now();

            // Process all webhooks concurrently
            const responses = await Promise.all(
                webhookRequests.map(request => payHandler.POST(request))
            );

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            // All should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            // Performance assertion - should process 20 webhooks in reasonable time (< 5 seconds)
            expect(processingTime).toBeLessThan(5000);

            // But tokens should only be added once (due to duplicate prevention)
            const tokenBalance = await getUserTokenBalance(user.id);
            expect(tokenBalance).toBe(tokenPackage.tokens);

            const transactions = await getUserTokenTransactions(user.id);
            expect(transactions).toHaveLength(1); // Only one transaction should be created
        }, 15000); // Increased timeout to 15 seconds
    });
});

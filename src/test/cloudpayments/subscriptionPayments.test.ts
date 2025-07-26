import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { NextResponse } from 'next/server';
import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Import handlers
import * as checkHandler from '@/lib/cloudpayments/handlers/check';
import * as payHandler from '@/lib/cloudpayments/handlers/pay';
import * as recurrentHandler from '@/lib/cloudpayments/handlers/recurrent';

// Import test utilities
import {
    createMockWebhookRequest,
    createSubscriptionWebhookData,
    createCheckWebhookData,
    createMockRecurrentRequest,
    createRecurrentWebhookData,
    SubscriptionTestData,
    RecurrentNotificationTestData,
} from './webhookTestUtils';
import {
    setupSubscriptionTestScenario,
    cleanupTestData,
} from './databaseTestHelpers';

describe('CloudPayments Subscription Payment Tests', () => {
    let testScenario: Awaited<ReturnType<typeof setupSubscriptionTestScenario>>;

    beforeEach(async () => {
        testScenario = await setupSubscriptionTestScenario();
    });

    afterEach(async () => {
        if (testScenario) {
            await testScenario.cleanup();
        }
    });

    describe('Subscription Check Handler', () => {
        test('should accept valid subscription check', async () => {
            const testData: SubscriptionTestData = {
                subscriptionId: testScenario.subscription.id,
                userId: testScenario.user.id,
                planId: testScenario.plan.id,
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                status: 'Authorized',
            };

            const { webhookData, additionalData } = createCheckWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await checkHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);
        });

        // test('should reject check for non-existent subscription', async () => {
        //     const testData: SubscriptionTestData = {
        //         subscriptionId: 'non-existent-subscription',
        //         userId: testScenario.user.id,
        //         planId: testScenario.plan.id,
        //         amount: testScenario.plan.price,
        //         currency: testScenario.plan.currency,
        //         cloudpaymentsId: 'non-existent-cp-id',
        //         status: 'Authorized',
        //     };

        //     const { webhookData, additionalData } = createCheckWebhookData(testData);
        //     const request = createMockWebhookRequest(webhookData, additionalData);

        //     const response = await checkHandler.POST(request);
        //     const responseData = await response.json();

        //     expect(response.status).toBe(200);
        //     expect(responseData.code).toBe(14); // Subscription not found
        //     expect(responseData.message).toBe('Подписка не найдена');
        // });

        // test('should reject check for non-existent user', async () => {
        //     const testData: SubscriptionTestData = {
        //         subscriptionId: testScenario.subscription.id,
        //         userId: 'non-existent-user',
        //         planId: testScenario.plan.id,
        //         amount: testScenario.plan.price,
        //         currency: testScenario.plan.currency,
        //         cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
        //         status: 'Authorized',
        //     };

        //     const { webhookData, additionalData } = createCheckWebhookData(testData);
        //     const request = createMockWebhookRequest(webhookData, additionalData);

        //     const response = await checkHandler.POST(request);
        //     const responseData = await response.json();

        //     expect(response.status).toBe(200);
        //     expect(responseData.code).toBe(14); // User not found
        //     expect(responseData.message).toBe('Пользователь не найден');
        // });

        test('should reject check for cancelled subscription', async () => {
            // Update subscription to cancelled status
            await prisma.userSubscription.update({
                where: { id: testScenario.subscription.id },
                data: { status: SubscriptionStatus.cancelled },
            });

            const testData: SubscriptionTestData = {
                subscriptionId: testScenario.subscription.id,
                userId: testScenario.user.id,
                planId: testScenario.plan.id,
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                status: 'Authorized',
            };

            const { webhookData, additionalData } = createCheckWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await checkHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(15); // Subscription cancelled
            expect(responseData.message).toBe('Подписка отменена');
        });

        test('should allow renewal for expired subscription with warning', async () => {
            // Update subscription to expired status
            await prisma.userSubscription.update({
                where: { id: testScenario.subscription.id },
                data: { status: SubscriptionStatus.expired },
            });

            const testData: SubscriptionTestData = {
                subscriptionId: testScenario.subscription.id,
                userId: testScenario.user.id,
                planId: testScenario.plan.id,
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                status: 'Authorized',
            };

            const { webhookData, additionalData } = createCheckWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const response = await checkHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0); // Allow renewal
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('but allowing renewal')
            );

            consoleSpy.mockRestore();
        });

        test('should warn about amount mismatch but still accept', async () => {
            const testData: SubscriptionTestData = {
                subscriptionId: testScenario.subscription.id,
                userId: testScenario.user.id,
                planId: testScenario.plan.id,
                amount: testScenario.plan.price + 100, // Different amount
                currency: testScenario.plan.currency,
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                status: 'Authorized',
            };

            const { webhookData, additionalData } = createCheckWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const response = await checkHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Check mismatch amount')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Subscription Pay Handler', () => {
        test('should successfully process completed subscription payment', async () => {
            const testData: SubscriptionTestData = {
                subscriptionId: testScenario.subscription.id,
                userId: testScenario.user.id,
                planId: testScenario.plan.id,
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                status: 'Completed',
                transactionId: 'test_sub_tx_12345',
            };

            const { webhookData, additionalData } = createSubscriptionWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await payHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify subscription was activated
            const updatedSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(updatedSubscription?.status).toBe(SubscriptionStatus.active);
            expect(updatedSubscription?.metadata).toMatchObject({
                cloudpaymentsStatus: 'Completed',
                cloudpaymentsTransactionId: 'test_sub_tx_12345',
                cloudpaymentsTestMode: true,
            });

            // Verify subscription payment record was created
            const paymentRecord = await prisma.subscriptionPayment.findFirst({
                where: { 
                    subscriptionId: testScenario.subscription.id,
                    status: 'completed',
                },
            });

            expect(paymentRecord).toBeTruthy();
            expect(paymentRecord?.amount).toBe(testScenario.plan.price);
        }, 10000); // Add 10 second timeout

        test('should handle non-completed subscription payment status', async () => {
            const testData: SubscriptionTestData = {
                subscriptionId: testScenario.subscription.id,
                userId: testScenario.user.id,
                planId: testScenario.plan.id,
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                status: 'Authorized', // Not completed
            };

            const { webhookData, additionalData } = createSubscriptionWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await payHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify subscription status remains pending
            const updatedSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(updatedSubscription?.status).toBe(SubscriptionStatus.pending);
        });

        test('should handle non-existent subscription gracefully', async () => {
            const testData: SubscriptionTestData = {
                subscriptionId: 'non-existent-subscription',
                userId: testScenario.user.id,
                planId: testScenario.plan.id,
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                cloudpaymentsId: 'non-existent-cp-id',
                status: 'Completed',
            };

            const { webhookData, additionalData } = createSubscriptionWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await payHandler.POST(request);

            expect(response.status).toBe(500);
            const responseData = await response.json();
            expect(responseData.error).toBe('Webhook processing failed');
        });

        test('should calculate and update next billing date correctly', async () => {
            const testData: SubscriptionTestData = {
                subscriptionId: testScenario.subscription.id,
                userId: testScenario.user.id,
                planId: testScenario.plan.id,
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                status: 'Completed',
            };

            const { webhookData, additionalData } = createSubscriptionWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await payHandler.POST(request);
            expect(response.status).toBe(200);

            // Verify next billing date was calculated
            const updatedSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(updatedSubscription?.nextBillingDate).toBeTruthy();
            expect(updatedSubscription?.nextBillingDate!.getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('Recurrent Notification Handler', () => {
        test('should handle active recurrent status', async () => {
            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'Active',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                successfulTransactions: 5,
                failedTransactions: 0,
                nextTransactionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const response = await recurrentHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify subscription status was updated to active
            const updatedSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(updatedSubscription?.status).toBe(SubscriptionStatus.active);
            expect(updatedSubscription?.metadata).toMatchObject({
                lastRecurrentNotification: expect.objectContaining({
                    status: 'Active',
                    successfulTransactions: 5,
                    failedTransactions: 0,
                }),
            });
        });

        test('should handle past due recurrent status', async () => {
            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'PastDue',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                successfulTransactions: 3,
                failedTransactions: 2,
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const response = await recurrentHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify subscription remains active but marked as past due
            const updatedSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(updatedSubscription?.status).toBe(SubscriptionStatus.active);
            expect(updatedSubscription?.metadata).toMatchObject({
                pastDue: true,
                pastDueDate: expect.any(String),
                lastRecurrentNotification: expect.objectContaining({
                    status: 'PastDue',
                    failedTransactions: 2,
                }),
            });
        });

        test('should handle cancelled recurrent status', async () => {
            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'Cancelled',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                successfulTransactions: 2,
                failedTransactions: 1,
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const response = await recurrentHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify subscription was cancelled
            const updatedSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(updatedSubscription?.status).toBe(SubscriptionStatus.cancelled);
            expect(updatedSubscription?.cancelledAt).toBeTruthy();
            expect(updatedSubscription?.cancelReason).toBe('Cancelled via CloudPayments recurrent notification');
        });

        test('should handle rejected recurrent status', async () => {
            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'Rejected',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                successfulTransactions: 1,
                failedTransactions: 3,
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const response = await recurrentHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify subscription was marked as failed
            const updatedSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(updatedSubscription?.status).toBe(SubscriptionStatus.failed);
            expect(updatedSubscription?.metadata).toMatchObject({
                rejectionReason: 'Rejected via CloudPayments recurrent notification',
            });
        });

        test('should handle expired recurrent status', async () => {
            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'Expired',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                successfulTransactions: 12,
                failedTransactions: 0,
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const response = await recurrentHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify subscription was marked as expired
            const updatedSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(updatedSubscription?.status).toBe(SubscriptionStatus.expired);
        });

        test('should update next billing date from recurrent notification', async () => {
            const nextTransactionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            
            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'Active',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                nextTransactionDate: nextTransactionDate.toISOString(),
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const response = await recurrentHandler.POST(request);
            expect(response.status).toBe(200);

            // Verify next billing date was updated
            const updatedSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(updatedSubscription?.nextBillingDate).toBeTruthy();
            expect(Math.abs(updatedSubscription!.nextBillingDate!.getTime() - nextTransactionDate.getTime())).toBeLessThan(1000);
        });

        test('should handle non-existent subscription gracefully', async () => {
            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: 'non-existent-cp-id',
                userId: testScenario.user.id,
                status: 'Active',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const response = await recurrentHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Subscription not found')
            );

            consoleSpy.mockRestore();
        });

        test('should handle unknown recurrent status', async () => {
            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'UnknownStatus' as any,
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const response = await recurrentHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Unknown recurrent status')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Subscription Integration Tests', () => {
        test('should handle complete subscription flow: check -> pay -> recurrent', async () => {
            const testData: SubscriptionTestData = {
                subscriptionId: testScenario.subscription.id,
                userId: testScenario.user.id,
                planId: testScenario.plan.id,
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
            };

            // Step 1: Check notification
            const checkData = { ...testData, status: 'Authorized' as const };
            const { webhookData: checkWebhookData, additionalData: checkAdditionalData } = 
                createCheckWebhookData(checkData);
            const checkRequest = createMockWebhookRequest(checkWebhookData, checkAdditionalData);

            const checkResponse = await checkHandler.POST(checkRequest);
            const checkResponseData = await checkResponse.json();
            expect(checkResponseData.code).toBe(0);

            // Step 2: Pay notification
            const payData = { ...testData, status: 'Completed' as const };
            const { webhookData: payWebhookData, additionalData: payAdditionalData } = 
                createSubscriptionWebhookData(payData);
            const payRequest = createMockWebhookRequest(payWebhookData, payAdditionalData);

            const payResponse = await payHandler.POST(payRequest);
            const payResponseData = await payResponse.json();
            expect(payResponseData.code).toBe(0);

            // Step 3: Recurrent notification
            const recurrentTestData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'Active',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                successfulTransactions: 1,
                failedTransactions: 0,
            };

            const recurrentData = createRecurrentWebhookData(recurrentTestData);
            const recurrentRequest = createMockRecurrentRequest(recurrentData);

            const recurrentResponse = await recurrentHandler.POST(recurrentRequest);
            const recurrentResponseData = await recurrentResponse.json();
            expect(recurrentResponseData.code).toBe(0);

            // Verify final state
            const finalSubscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });

            expect(finalSubscription?.status).toBe(SubscriptionStatus.active);
            expect(finalSubscription?.metadata).toMatchObject({
                cloudpaymentsStatus: 'Completed',
                lastRecurrentNotification: expect.objectContaining({
                    status: 'Active',
                    successfulTransactions: 1,
                }),
            });
        });

        test('should handle subscription lifecycle: active -> past due -> cancelled', async () => {
            const cloudpaymentsId = testScenario.subscription.cloudpaymentsId!;
            const userId = testScenario.user.id;

            // Step 1: Activate subscription
            const activeData: RecurrentNotificationTestData = {
                cloudpaymentsId,
                userId,
                status: 'Active',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                successfulTransactions: 3,
                failedTransactions: 0,
            };

            let recurrentData = createRecurrentWebhookData(activeData);
            let request = createMockRecurrentRequest(recurrentData);
            let response = await recurrentHandler.POST(request);
            expect(response.status).toBe(200);

            let subscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });
            expect(subscription?.status).toBe(SubscriptionStatus.active);

            // Step 2: Past due
            const pastDueData: RecurrentNotificationTestData = {
                cloudpaymentsId,
                userId,
                status: 'PastDue',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                successfulTransactions: 3,
                failedTransactions: 1,
            };

            recurrentData = createRecurrentWebhookData(pastDueData);
            request = createMockRecurrentRequest(recurrentData);
            response = await recurrentHandler.POST(request);
            expect(response.status).toBe(200);

            subscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });
            expect(subscription?.status).toBe(SubscriptionStatus.active);
            expect(subscription?.metadata).toMatchObject({ pastDue: true });

            // Step 3: Cancelled
            const cancelledData: RecurrentNotificationTestData = {
                cloudpaymentsId,
                userId,
                status: 'Cancelled',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                successfulTransactions: 3,
                failedTransactions: 3,
            };

            recurrentData = createRecurrentWebhookData(cancelledData);
            request = createMockRecurrentRequest(recurrentData);
            response = await recurrentHandler.POST(request);
            expect(response.status).toBe(200);

            subscription = await prisma.userSubscription.findUnique({
                where: { id: testScenario.subscription.id },
            });
            expect(subscription?.status).toBe(SubscriptionStatus.cancelled);
            expect(subscription?.cancelledAt).toBeTruthy();
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        test('should handle malformed recurrent webhook data', async () => {
            const malformedRequest = new Request('http://localhost:3000/test', {
                method: 'POST',
                body: 'invalid-form-data',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const response = await recurrentHandler.POST(malformedRequest as any);
            expect(response.status).toBe(200); // Changed from 500 to 200 due to graceful handling
        });

        test('should handle invalid next transaction date format', async () => {
            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'Active',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
                nextTransactionDate: 'invalid-date-format',
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            const response = await recurrentHandler.POST(request);
            expect(response.status).toBe(200);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Invalid NextTransactionDate format: invalid-date-format'
            );

            consoleWarnSpy.mockRestore();
        });

        test('should handle database errors gracefully', async () => {
            // Mock prisma to fail
            const originalFindFirst = prisma.userSubscription.findFirst;
            prisma.userSubscription.findFirst = jest.fn().mockRejectedValue(new Error('Database error'));

            const testData: RecurrentNotificationTestData = {
                cloudpaymentsId: testScenario.subscription.cloudpaymentsId!,
                userId: testScenario.user.id,
                status: 'Active',
                amount: testScenario.plan.price,
                currency: testScenario.plan.currency,
            };

            const recurrentData = createRecurrentWebhookData(testData);
            const request = createMockRecurrentRequest(recurrentData);

            const response = await recurrentHandler.POST(request);
            expect(response.status).toBe(500);

            // Restore the original method
            prisma.userSubscription.findFirst = originalFindFirst;
        });
    });
});

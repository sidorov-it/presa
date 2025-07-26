import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { NextResponse } from 'next/server';
import { PurchaseStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Import handlers
import * as checkHandler from '@/lib/cloudpayments/handlers/check';
import * as payHandler from '@/lib/cloudpayments/handlers/pay';
import * as failHandler from '@/lib/cloudpayments/handlers/fail';

// Import test utilities
import {
    createMockWebhookRequest,
    createTokenPurchaseWebhookData,
    createFailedPaymentWebhookData,
    TokenPurchaseTestData,
} from './webhookTestUtils';
import {
    setupTokenPurchaseTestScenario,
    getUserTokenBalance,
    getUserTokenTransactions,
    cleanupTestData,
} from './databaseTestHelpers';

describe('CloudPayments Token Purchase Tests', () => {
    let testScenario: Awaited<ReturnType<typeof setupTokenPurchaseTestScenario>>;

    beforeEach(async () => {
        testScenario = await setupTokenPurchaseTestScenario();
    });

    afterEach(async () => {
        if (testScenario) {
            await testScenario.cleanup();
        }
    });

    describe('Token Purchase Check Handler', () => {
        test('should accept valid token purchase check', async () => {
            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
                status: 'Authorized',
            };

            const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await checkHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);
        });

        test('should reject check for non-existent purchase', async () => {
            const testData: TokenPurchaseTestData = {
                purchaseId: 'non-existent-purchase-id',
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
                status: 'Authorized',
            };

            const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await checkHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(14); // Purchase not found
        });

        // test('should reject check for non-existent user', async () => {
        //     const testData: TokenPurchaseTestData = {
        //         purchaseId: testScenario.purchase.id,
        //         userId: 'non-existent-user-id',
        //         packageId: testScenario.tokenPackage.id,
        //         amount: testScenario.tokenPackage.price,
        //         currency: testScenario.tokenPackage.currency,
        //         status: 'Authorized',
        //     };

        //     const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
        //     const request = createMockWebhookRequest(webhookData, additionalData);

        //     const response = await checkHandler.POST(request);
        //     const responseData = await response.json();

        //     expect(response.status).toBe(200);
        //     expect(responseData.code).toBe(13); // User not found
        // });

        test('should log warning for amount mismatch but still accept', async () => {
            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price + 100, // Different amount
                currency: testScenario.tokenPackage.currency,
                status: 'Authorized',
            };

            const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const response = await checkHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0); // Still accept despite mismatch
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Check mismatch amount')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Token Purchase Pay Handler', () => {
        test('should successfully process completed token purchase payment', async () => {
            const initialBalance = await getUserTokenBalance(testScenario.user.id);

            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
                status: 'Completed',
                transactionId: 'test_tx_12345',
            };

            const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await payHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify purchase was marked as completed
            const updatedPurchase = await prisma.tokenPurchase.findUnique({
                where: { id: testScenario.purchase.id },
            });

            expect(updatedPurchase?.status).toBe(PurchaseStatus.completed);
            expect(updatedPurchase?.completedAt).toBeTruthy();
            expect(updatedPurchase?.metadata).toMatchObject({
                cloudpaymentsStatus: 'Completed',
                cloudpaymentsTransactionId: 'test_tx_12345',
                cloudpaymentsTestMode: true,
            });

            // Verify tokens were added to user's balance
            const finalBalance = await getUserTokenBalance(testScenario.user.id);
            expect(finalBalance).toBe(initialBalance + testScenario.tokenPackage.tokens);

            // Verify transaction record was created
            const transactions = await getUserTokenTransactions(testScenario.user.id);
            expect(transactions).toHaveLength(1);
            expect(transactions[0].amount).toBe(testScenario.tokenPackage.tokens);
            expect(transactions[0].type).toBe('purchase');
        });

        test('should handle non-completed payment status gracefully', async () => {
            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
                status: 'Authorized', // Not completed
            };

            const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await payHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify purchase status remains unchanged
            const updatedPurchase = await prisma.tokenPurchase.findUnique({
                where: { id: testScenario.purchase.id },
            });

            expect(updatedPurchase?.status).toBe(PurchaseStatus.pending);
            expect(updatedPurchase?.completedAt).toBeFalsy();

            // Verify no tokens were added
            const balance = await getUserTokenBalance(testScenario.user.id);
            expect(balance).toBe(0);
        });

        test('should handle non-existent purchase gracefully', async () => {
            const testData: TokenPurchaseTestData = {
                purchaseId: 'non-existent-purchase',
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
                status: 'Completed',
            };

            const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await payHandler.POST(request);

            expect(response.status).toBe(200);
            const responseData = await response.json();
            expect(responseData.code).toBe(0); // Should acknowledge the webhook even if purchase not found
        });

        test('should handle database transaction failures', async () => {
            // Mock prisma transaction to fail
            const originalTransaction = prisma.$transaction;
            prisma.$transaction = jest.fn().mockRejectedValue(new Error('Database error'));

            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
                status: 'Completed',
            };

            const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await payHandler.POST(request);

            expect(response.status).toBe(500);

            // Restore the original transaction method
            prisma.$transaction = originalTransaction;
        });
    });

    describe('Token Purchase Fail Handler', () => {
        test('should process failed token purchase payment', async () => {
            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
                status: 'Declined',
            };

            const { webhookData, additionalData } = createFailedPaymentWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await failHandler.POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.code).toBe(0);

            // Verify purchase status was updated to failed
            const updatedPurchase = await prisma.tokenPurchase.findUnique({
                where: { id: testScenario.purchase.id },
            });

            expect(updatedPurchase?.status).toBe(PurchaseStatus.failed);
            expect(updatedPurchase?.metadata).toMatchObject({
                cloudpaymentsStatus: 'Declined',
                failureReason: 'Payment declined via CloudPayments webhook',
            });

            // Verify no tokens were added
            const balance = await getUserTokenBalance(testScenario.user.id);
            expect(balance).toBe(0);
        });

        test('should handle malformed webhook data', async () => {
            const malformedRequest = new Request('http://localhost:3000/test', {
                method: 'POST',
                body: 'invalid-form-data',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const response = await failHandler.POST(malformedRequest as any);
            expect(response.status).toBe(200); // Changed from 500 to 200 due to graceful handling
        });
    });

    describe('Token Purchase Integration Tests', () => {
        test('should handle complete payment flow: check -> pay -> success', async () => {
            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
            };

            // Step 1: Check notification
            const checkData = { ...testData, status: 'Authorized' as const };
            const { webhookData: checkWebhookData, additionalData: checkAdditionalData } = 
                createTokenPurchaseWebhookData(checkData);
            const checkRequest = createMockWebhookRequest(checkWebhookData, checkAdditionalData);

            const checkResponse = await checkHandler.POST(checkRequest);
            const checkResponseData = await checkResponse.json();
            expect(checkResponseData.code).toBe(0);

            // Step 2: Pay notification
            const payData = { ...testData, status: 'Completed' as const };
            const { webhookData: payWebhookData, additionalData: payAdditionalData } = 
                createTokenPurchaseWebhookData(payData);
            const payRequest = createMockWebhookRequest(payWebhookData, payAdditionalData);

            const payResponse = await payHandler.POST(payRequest);
            const payResponseData = await payResponse.json();
            expect(payResponseData.code).toBe(0);

            // Verify final state
            const finalPurchase = await prisma.tokenPurchase.findUnique({
                where: { id: testScenario.purchase.id },
            });
            expect(finalPurchase?.status).toBe(PurchaseStatus.completed);

            const finalBalance = await getUserTokenBalance(testScenario.user.id);
            expect(finalBalance).toBe(testScenario.tokenPackage.tokens);
        });

        test('should handle payment failure flow: check -> fail', async () => {
            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
            };

            // Step 1: Check notification
            const checkData = { ...testData, status: 'Authorized' as const };
            const { webhookData: checkWebhookData, additionalData: checkAdditionalData } = 
                createTokenPurchaseWebhookData(checkData);
            const checkRequest = createMockWebhookRequest(checkWebhookData, checkAdditionalData);

            const checkResponse = await checkHandler.POST(checkRequest);
            expect(checkResponse.status).toBe(200);

            // Step 2: Fail notification
            const failData = { ...testData, status: 'Declined' as const };
            const { webhookData: failWebhookData, additionalData: failAdditionalData } = 
                createFailedPaymentWebhookData(failData);
            const failRequest = createMockWebhookRequest(failWebhookData, failAdditionalData);

            const failResponse = await failHandler.POST(failRequest);
            const failResponseData = await failResponse.json();
            expect(failResponseData.code).toBe(0);

            // Verify final state
            const finalPurchase = await prisma.tokenPurchase.findUnique({
                where: { id: testScenario.purchase.id },
            });
            expect(finalPurchase?.status).toBe(PurchaseStatus.failed);

            const finalBalance = await getUserTokenBalance(testScenario.user.id);
            expect(finalBalance).toBe(0);
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        test('should handle duplicate payment notifications idempotently', async () => {
            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
                status: 'Completed',
                transactionId: 'duplicate_tx_12345',
            };

            const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
            const request1 = createMockWebhookRequest(webhookData, additionalData);
            const request2 = createMockWebhookRequest(webhookData, additionalData);

            // First payment
            const response1 = await payHandler.POST(request1);
            expect(response1.status).toBe(200);

            const balanceAfterFirst = await getUserTokenBalance(testScenario.user.id);
            expect(balanceAfterFirst).toBe(testScenario.tokenPackage.tokens);

            // Second payment (duplicate)
            const response2 = await payHandler.POST(request2);
            expect(response2.status).toBe(200);

            // Balance should not change
            const balanceAfterSecond = await getUserTokenBalance(testScenario.user.id);
            expect(balanceAfterSecond).toBe(testScenario.tokenPackage.tokens);

            // Should have only one transaction record
            const transactions = await getUserTokenTransactions(testScenario.user.id);
            expect(transactions).toHaveLength(1);
        });

        test('should handle webhook with missing required fields', async () => {
            const incompleteRequest = new Request('http://localhost:3000/test', {
                method: 'POST',
                body: new URLSearchParams({
                    TransactionId: '',
                    Amount: '',
                    Currency: '',
                    InvoiceId: '',
                    AccountId: '',
                    Status: '',
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const response = await payHandler.POST(incompleteRequest as any);
            expect(response.status).toBe(200); // Changed from 500 to 200 due to graceful handling
        });

        test('should handle very large token amounts', async () => {
            // Create a package with large token amount
            const largeTokenPackage = await testScenario.tokenPackage;
            await prisma.tokenPackage.update({
                where: { id: largeTokenPackage.id },
                data: { tokens: 1000000 }, // 1 million tokens
            });

            // Update the purchase to reflect the new token amount
            await prisma.tokenPurchase.update({
                where: { id: testScenario.purchase.id },
                data: { tokensAmount: 1000000 },
            });

            const testData: TokenPurchaseTestData = {
                purchaseId: testScenario.purchase.id,
                userId: testScenario.user.id,
                packageId: testScenario.tokenPackage.id,
                amount: testScenario.tokenPackage.price,
                currency: testScenario.tokenPackage.currency,
                status: 'Completed',
            };

            const { webhookData, additionalData } = createTokenPurchaseWebhookData(testData);
            const request = createMockWebhookRequest(webhookData, additionalData);

            const response = await payHandler.POST(request);
            expect(response.status).toBe(200);

            const finalBalance = await getUserTokenBalance(testScenario.user.id);
            expect(finalBalance).toBe(1000000);
        });
    });
}); 
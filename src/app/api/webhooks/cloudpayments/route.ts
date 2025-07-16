import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PurchaseStatus, TransactionType } from '@prisma/client';
import { addTokens } from '@/utils/tokens';

interface CloudPaymentsWebhookData {
    TransactionId: string;
    Amount: string;
    Currency: string;
    PaymentAmount: string;
    PaymentCurrency: string;
    OperationType: string;
    InvoiceId: string;
    AccountId: string;
    Status: string;
    Description: string;
    TestMode: string;
    Data: string;
    DateTime: string;
}

export async function POST(request: NextRequest) {
    try {
        // Получаем данные как form-urlencoded
        const formData = await request.formData();

        // Преобразуем FormData в объект
        const webhookData: CloudPaymentsWebhookData = {
            TransactionId: formData.get('TransactionId') as string,
            Amount: formData.get('Amount') as string,
            Currency: formData.get('Currency') as string,
            PaymentAmount: formData.get('PaymentAmount') as string,
            PaymentCurrency: formData.get('PaymentCurrency') as string,
            OperationType: formData.get('OperationType') as string,
            InvoiceId: formData.get('InvoiceId') as string,
            AccountId: formData.get('AccountId') as string,
            Status: formData.get('Status') as string,
            Description: formData.get('Description') as string,
            TestMode: formData.get('TestMode') as string,
            Data: formData.get('Data') as string,
            DateTime: formData.get('DateTime') as string,
        };

        await prisma.cloudPaymentsWebhookLog.create({
            data: {
                transactionId: webhookData.TransactionId,
                invoiceId: webhookData.InvoiceId,
                accountId: webhookData.AccountId,
                status: webhookData.Status,
                operationType: webhookData.OperationType,
                testMode: webhookData.TestMode === '1',
                rawData: Object.fromEntries(formData.entries()),
            }
        });

        console.log('CloudPayments webhook received:', webhookData);

        // Находим покупку по InvoiceId
        const purchase = await prisma.tokenPurchase.findFirst({
            where: { id: webhookData.InvoiceId },
            include: { package: true },
        });

        if (!purchase) {
            console.error('Purchase not found for InvoiceId:', webhookData.InvoiceId);
            return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
        }

        // Парсим дополнительные данные
        let additionalData = {};
        try {
            if (webhookData.Data) {
                additionalData = JSON.parse(webhookData.Data);
            }
        } catch (e) {
            console.warn('Failed to parse additional data:', webhookData.Data);
        }

        if (purchase.status === PurchaseStatus.completed && purchase.metadata?.cloudpaymentsTxId === webhookData.TransactionId) {
            console.log('Duplicate webhook received — already processed');
            return NextResponse.json({ code: 0 });
        }

        // Обновляем статус покупки в зависимости от статуса CloudPayments
        if (webhookData.Status === 'Completed') {
            // Завершаем покупку и начисляем токены
            await prisma.$transaction(async (tx) => {
                const updatedPurchaseData = {
                    status: PurchaseStatus.completed,
                    completedAt: new Date(),
                    metadata: {
                        ...(purchase.metadata as Record<string, any> || {}),
                        cloudpaymentsStatus: webhookData.Status,
                        cloudpaymentsTransactionId: webhookData.TransactionId,
                        cloudpaymentsAmount: webhookData.Amount,
                        cloudpaymentsCurrency: webhookData.Currency,
                        cloudpaymentsDateTime: webhookData.DateTime,
                        cloudpaymentsTestMode: webhookData.TestMode === '1',
                        cloudpaymentsTxId: webhookData.TransactionId,
                        ...additionalData,
                    },
                };

                const updatedPurchase = await tx.tokenPurchase.update({
                    where: { id: purchase.id },
                    data: updatedPurchaseData
                });

                console.log('updatedPurchase', updatedPurchase);

                await addTokens(
                    purchase.userId,
                    purchase.tokensAmount,
                    TransactionType.purchase,
                    `Покупка токенов: ${purchase.package.name}`,
                    purchase.id,
                    {
                        paymentProvider: 'cloudpayments',
                        paymentId: webhookData.TransactionId,
                        packageName: purchase.package.name,
                        tokensAmount: purchase.tokensAmount,
                        cloudpaymentsData: additionalData,
                    }
                );
            });

            console.log('Payment completed successfully:', {
                purchaseId: purchase.id,
                transactionId: webhookData.TransactionId,
                amount: webhookData.Amount,
                tokensAdded: purchase.tokensAmount,
            });
        } else if (webhookData.Status === 'Failed' || webhookData.Status === 'Cancelled') {
            await prisma.tokenPurchase.update({
                where: { id: purchase.id },
                data: {
                    status: webhookData.Status === 'Failed' ? PurchaseStatus.failed : PurchaseStatus.canceled,
                    metadata: {
                        ...(purchase.metadata as Record<string, any> || {}),
                        cloudpaymentsStatus: webhookData.Status,
                        cloudpaymentsTransactionId: webhookData.TransactionId,
                        cloudpaymentsDateTime: webhookData.DateTime,
                        cloudpaymentsTestMode: webhookData.TestMode === '1',
                        ...additionalData,
                    },
                },
            });

            console.log('Payment failed/cancelled:', {
                purchaseId: purchase.id,
                transactionId: webhookData.TransactionId,
                status: webhookData.Status,
            });
        }

        return NextResponse.json({ code: 0 });
    } catch (error) {
        console.error('Error processing CloudPayments webhook:', error);
        return NextResponse.json({
            error: 'Webhook processing failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
} 
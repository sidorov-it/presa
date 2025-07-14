import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getYooKassaService } from '@/services/payments/yookassa';
import { prisma } from '@/lib/prisma';
import { PurchaseStatus, TransactionType } from '@prisma/client';
import { addTokens } from '@/utils/tokens';

interface YooKassaWebhookEvent {
    type: 'payment.succeeded' | 'payment.canceled' | 'payment.waiting_for_capture';
    event: 'payment.succeeded' | 'payment.canceled' | 'payment.waiting_for_capture';
    object: {
        id: string;
        status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
        amount: {
            value: string;
            currency: string;
        };
        description: string;
        metadata?: Record<string, any>;
        created_at: string;
        captured_at?: string;
        canceled_at?: string;
    };
}

async function POSTHandler(request: NextRequest) {
    try {
        // Получаем тело запроса как текст для валидации подписи
        const body = await request.text();

        logger.debug('body', body);
        // Получаем заголовок с подписью (если используется)
        const signature = request.headers.get('X-Yookassa-Signature') || '';

        // Валидируем подпись (опционально)
        if (signature) {
            const yooKassaService = getYooKassaService();
            const isValid = yooKassaService.validateWebhookSignature(body, signature);

            if (!isValid) {
                logger.error('Invalid YooKassa webhook signature');
                return NextResponse.json({ error: 'Неверная подпись' }, { status: 401 });
            }
        }

        // Парсим данные webhook
        const webhookData: YooKassaWebhookEvent = JSON.parse(body);
        const payment = webhookData.object;

        logger.debug('YooKassa webhook received:', {
            type: webhookData.type,
            paymentId: payment.id,
            status: payment.status,
            metadata: payment.metadata,
        });

        // Находим покупку в нашей БД
        const purchase = await prisma.tokenPurchase.findFirst({
            where: {
                paymentId: payment.id,
            },
            include: {
                package: true,
            },
        });

        if (!purchase) {
            logger.error('Purchase not found for payment ID:', payment.id);
            return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
        }

        // Обрабатываем различные статусы платежа
        switch (webhookData.event) {
            case 'payment.succeeded':
                await handleSuccessfulPayment(purchase, payment);
                break;

            case 'payment.canceled':
                await handleCanceledPayment(purchase, payment);
                break;

            case 'payment.waiting_for_capture':
                await handleWaitingForCapture(purchase, payment);
                break;

            default:
                logger.debug('Unhandled webhook type:', webhookData.type);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error processing YooKassa webhook:', error);
        return NextResponse.json(
            {
                error: 'Webhook processing failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

async function handleSuccessfulPayment(purchase: any, payment: any) {
    // Проверяем, что платеж еще не был обработан
    if (purchase.status === PurchaseStatus.completed) {
        logger.debug('Payment already processed:', payment.id);
        return;
    }

    try {
        // Начинаем транзакцию
        await prisma.$transaction(async tx => {
            // Обновляем статус покупки
            await tx.tokenPurchase.update({
                where: { id: purchase.id },
                data: {
                    status: PurchaseStatus.completed,
                    completedAt: new Date(),
                    metadata: {
                        ...purchase.metadata,
                        yookassaCompletedAt: payment.captured_at || payment.created_at,
                        yookassaFinalStatus: payment.status,
                    },
                },
            });

            // Добавляем токены пользователю
            await addTokens(
                purchase.userId,
                purchase.tokensAmount,
                TransactionType.purchase,
                `Покупка токенов: ${purchase.package.name}`,
                purchase.id,
                {
                    paymentProvider: 'yookassa',
                    paymentId: payment.id,
                    packageName: purchase.package.name,
                    tokensAmount: purchase.tokensAmount,
                }
            );
        });

        logger.debug('Successfully processed payment:', {
            purchaseId: purchase.id,
            userId: purchase.userId,
            tokensAdded: purchase.tokensAmount,
            paymentId: payment.id,
        });
    } catch (error) {
        logger.error('Error processing successful payment:', error);

        // Обновляем статус на failed
        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                status: PurchaseStatus.failed,
                metadata: {
                    ...purchase.metadata,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    failedAt: new Date().toISOString(),
                },
            },
        });

        throw error;
    }
}

async function handleCanceledPayment(purchase: any, payment: any) {
    try {
        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                status: PurchaseStatus.canceled,
                metadata: {
                    ...purchase.metadata,
                    yookassaCanceledAt: payment.canceled_at || payment.created_at,
                    yookassaFinalStatus: payment.status,
                },
            },
        });

        logger.debug('Payment canceled:', {
            purchaseId: purchase.id,
            paymentId: payment.id,
        });
    } catch (error) {
        logger.error('Error processing canceled payment:', error);
        throw error;
    }
}

async function handleWaitingForCapture(purchase: any, payment: any) {
    try {
        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                status: PurchaseStatus.pending,
                metadata: {
                    ...purchase.metadata,
                    yookassaStatus: payment.status,
                    waitingForCapture: true,
                    updatedAt: new Date().toISOString(),
                },
            },
        });

        logger.debug('Payment waiting for capture:', {
            purchaseId: purchase.id,
            paymentId: payment.id,
        });
    } catch (error) {
        logger.error('Error processing waiting for capture:', error);
        throw error;
    }
}
export const POST = withLogging(POSTHandler);

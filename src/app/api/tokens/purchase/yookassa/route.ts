import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getYooKassaService } from '@/services/payments/yookassa';
import { prisma } from '@/lib/prisma';
import { PurchaseStatus } from '@prisma/client';

interface CreatePaymentRequest {
    packageId: string;
    returnUrl?: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { packageId, returnUrl }: CreatePaymentRequest = await request.json();

        if (!packageId) {
            return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
        }

        // Получаем пакет токенов
        const tokenPackage = await prisma.tokenPackage.findUnique({
            where: {
                id: packageId,
                isActive: true,
            },
        });

        if (!tokenPackage) {
            return NextResponse.json({ error: 'Token package not found' }, { status: 404 });
        }

        // Создаем запись о покупке в БД
        const purchase = await prisma.tokenPurchase.create({
            data: {
                userId: session.user.id,
                packageId: tokenPackage.id,
                tokensAmount: tokenPackage.tokens,
                price: tokenPackage.price,
                currency: tokenPackage.currency,
                status: PurchaseStatus.pending,
                paymentProvider: 'yookassa',
            },
        });

        // Подготавливаем данные для YooKassa
        const paymentData = {
            amount: {
                value: tokenPackage.price.toFixed(2),
                currency: tokenPackage.currency.toUpperCase(),
            },
            payment_method_data: {
                type: 'bank_card',
            },
            confirmation: {
                type: 'redirect' as const,
                return_url: returnUrl || `${process.env.NEXTAUTH_URL}/tokens?purchase=${purchase.id}`,
            },
            description: `Покупка токенов: ${tokenPackage.name} (${tokenPackage.tokens} токенов)`,
            metadata: {
                purchaseId: purchase.id,
                userId: session.user.id,
                packageId: tokenPackage.id,
                tokensAmount: tokenPackage.tokens.toString(),
            },
            capture: true, // Автоматическое подтверждение платежа
        };

        // Создаем платеж в YooKassa
        const yooKassaService = getYooKassaService();
        const payment = await yooKassaService.createPayment(paymentData);

        // Обновляем запись о покупке с ID платежа
        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                paymentId: payment.id,
                metadata: {
                    yookassaPaymentId: payment.id,
                    yookassaStatus: payment.status,
                    confirmationUrl: payment.confirmation?.confirmation_url,
                },
            },
        });

        return NextResponse.json({
            success: true,
            purchaseId: purchase.id,
            paymentId: payment.id,
            confirmationUrl: payment.confirmation?.confirmation_url,
            amount: payment.amount,
            status: payment.status,
        });

    } catch (error) {
        console.error('Error creating YooKassa payment:', error);
        
        return NextResponse.json({
            error: 'Failed to create payment',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
} 
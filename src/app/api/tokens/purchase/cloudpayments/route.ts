import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
            where: { id: packageId, isActive: true },
        });
        if (!tokenPackage) {
            return NextResponse.json({ error: 'Token package not found' }, { status: 404 });
        }

        // Создаем запись о покупке
        const purchase = await prisma.tokenPurchase.create({
            data: {
                userId: session.user.id,
                packageId: tokenPackage.id,
                tokensAmount: tokenPackage.tokens,
                price: tokenPackage.price,
                currency: tokenPackage.currency,
                status: PurchaseStatus.pending,
                paymentProvider: 'cloudpayments',
            },
        });

        // Возвращаем параметры для CloudPayments-виджета
        return NextResponse.json({
            success: true,
            purchaseId: purchase.id,
            // confirmationUrl: process.env.CLOUDPAYMENTS_PUBLIC_ID, // publicId для виджета CloudPayments
            amount: tokenPackage.price,
            currency: tokenPackage.currency,
            description: `Покупка токенов: ${tokenPackage.name} (${tokenPackage.tokens} токенов)`,
        });
    } catch (error) {
        console.error('Error creating CloudPayments payment:', error);
        return NextResponse.json(
            {
                error: 'Failed to create payment',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

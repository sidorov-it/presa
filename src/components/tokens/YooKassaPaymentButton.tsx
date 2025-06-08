'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useYooKassaPayment } from '@/hooks/useYooKassaPayment';
import { TokenPackage } from '@/types/tokens';

interface YooKassaPaymentButtonProps {
    tokenPackage: TokenPackage;
    onPaymentSuccess?: (purchaseId: string) => void;
    onPaymentError?: (error: string) => void;
    disabled?: boolean;
    className?: string;
}

export const YooKassaPaymentButton: React.FC<YooKassaPaymentButtonProps> = ({
    tokenPackage,
    onPaymentSuccess,
    onPaymentError,
    disabled = false,
    className,
}) => {
    const { createPayment, loading, error } = useYooKassaPayment();
    const [processingPayment, setProcessingPayment] = useState(false);

    const handlePayment = async () => {
        try {
            setProcessingPayment(true);

            // Создаем платеж
            const paymentResponse = await createPayment({
                packageId: tokenPackage.id,
                returnUrl: `${window.location.origin}/tokens`,
            });

            // Сохраняем ID покупки для дальнейшего отслеживания
            if (onPaymentSuccess) {
                onPaymentSuccess(paymentResponse.purchaseId);
            }

            // Перенаправляем пользователя на страницу оплаты YooKassa
            window.location.href = paymentResponse.confirmationUrl;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании платежа';
            console.error('Payment error:', errorMessage);

            if (onPaymentError) {
                onPaymentError(errorMessage);
            }
        } finally {
            setProcessingPayment(false);
        }
    };

    const isLoading = loading || processingPayment;

    return (
        <div className="flex flex-col gap-2">
            <Button
                onClick={handlePayment}
                disabled={disabled || isLoading}
                className={className}
                variant="default"
                size="lg"
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Создание платежа...
                    </div>
                ) : (
                    `Оплатить ${tokenPackage.price} ${tokenPackage.currency.toUpperCase()}`
                )}
            </Button>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                    {error}
                </div>
            )}

            <div className="text-xs text-gray-500 text-center">
                Безопасная оплата через YooKassa
            </div>
        </div>
    );
}; 
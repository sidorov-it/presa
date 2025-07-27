import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface PaymentData {
    packageId: string;
    returnUrl?: string;
}

interface PaymentResponse {
    purchaseId: string;
    publicId: string;
    amount: number;
    currency: string;
    description: string;
}

export const useCloudPaymentsPayment = () => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Создание платежа и открытие CloudPayments виджета
    const createPayment = useCallback(
        async (paymentData: PaymentData): Promise<PaymentResponse> => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/tokens/purchase/cloudpayments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(paymentData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create payment');
                }

                const result = await response.json();

                // Открываем CloudPayments виджет через CDN
                if (window.cp?.CloudPayments) {
                    const cp = new window.cp.CloudPayments();
                    // eslint-disable-next-line no-trailing-spaces

                    cp.pay(
                        'charge',
                        {
                            // publicId: process.env.CLOUDPAYMENTS_PUBLIC_ID!, // publicId CloudPayments
                            publicId: 'pk_99c7613d5b4422d18b4784f5ff9e4', // publicId CloudPayments

                            description: result.description,
                            amount: Number(result.amount),
                            currency: result.currency.toUpperCase(),
                            invoiceId: result.purchaseId,
                            accountId: session?.user?.id || '',
                            skin: 'classic',
                            data: {
                                packageId: paymentData.packageId,
                                userId: session?.user?.id,
                            },
                        },
                        {
                            onSuccess: function (options: any) {
                                console.log('Payment successful:', options);
                                // Платеж успешен, webhook обновит статус
                            },
                            onFail: function (reason: any, options: any) {
                                console.error('Payment failed:', reason, options);
                                setError('Платеж не удался');
                            },
                            onComplete: function (paymentResult: any, options: any) {
                                console.log('Payment completed:', paymentResult, options);
                                setLoading(false);
                            },
                        }
                    );
                } else {
                    throw new Error('CloudPayments widget not loaded');
                }

                return {
                    purchaseId: result.purchaseId,
                    // publicId: result.confirmationUrl,
                    amount: result.amount,
                    currency: result.currency,
                    description: result.description,
                };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                setError(errorMessage);
                throw new Error(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [session?.user?.id]
    );

    // Проверка статуса платежа
    const checkPaymentStatus = useCallback(async (purchaseId: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/tokens/purchase/status/${purchaseId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to check payment status');
            }
            return await response.json();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        createPayment,
        checkPaymentStatus,
        loading,
        error,
    };
};

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { logCaughtError } from '@/utils/errorReporting';

interface UseTokensReturn {
    balance: number;
    loading: boolean;
    error: string | null;
    createTokensPayment: (paymentData: PaymentData) => Promise<PaymentResponse>;
}

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

export const useTokens = (): UseTokensReturn => {
    const { data: session } = useSession();
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshBalance = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const response = await fetch('/api/tokens/balance');
            if (!response.ok) throw new Error('Failed to fetch balance');

            const data = await response.json();
            setBalance(data.balance);
            setError(null);
        } catch (err) {
            logCaughtError(err, {
                action: 'Получение баланса токенов',
                component: 'useTokens',
                additionalInfo: { userId: session?.user?.id },
            });
            setError(err instanceof Error ? err.message : 'Failed to fetch balance');
        }
    }, [session?.user?.id]);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                await Promise.all([refreshBalance()]);
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.id) {
            loadInitialData();
        } else {
            setLoading(false);
        }
    }, [session?.user?.id, refreshBalance]);

    // Создание платежа и открытие CloudPayments виджета
    const createTokensPayment = useCallback(
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

                                // Платеж успешен, webhook обновит статус
                            },
                            onFail: function (reason: any, options: any) {
                                console.error('Payment failed:', reason, options);
                                setError('Платеж не удался');
                            },
                            onComplete: function (paymentResult: any, options: any) {

                                setLoading(false);
                            },
                        }
                    );
                } else {
                    throw new Error('CloudPayments widget not loaded');
                }

                return {
                    purchaseId: result.purchaseId,
                    publicId: result.confirmationUrl,
                    amount: result.amount,
                    currency: result.currency,
                    description: result.description,
                };
            } catch (err) {
                logCaughtError(err, {
                    action: 'Создание платежа токенов',
                    component: 'useTokens.createTokensPayment',
                    additionalInfo: {
                        packageId: paymentData.packageId,
                        userId: session?.user?.id,
                    },
                });
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                setError(errorMessage);
                throw new Error(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [session?.user?.id]
    );

    return {
        balance,
        loading,
        error,
        createTokensPayment,
    };
};

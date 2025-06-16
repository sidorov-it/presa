import { useState, useCallback } from 'react';

interface PaymentData {
    packageId: string;
    returnUrl?: string;
}

interface PaymentResponse {
    success: boolean;
    purchaseId: string;
    paymentId: string;
    confirmationUrl: string;
    amount: {
        value: string;
        currency: string;
    };
    status: string;
}

interface PurchaseStatus {
    purchase: {
        id: string;
        status: 'pending' | 'completed' | 'failed' | 'canceled';
        tokensAmount: number;
        price: number;
        currency: string;
        createdAt: string;
        completedAt?: string;
        package: {
            id: string;
            name: string;
            description?: string;
            tokens: number;
        };
    };
    payment?: {
        id: string;
        status: string;
        amount: {
            value: string;
            currency: string;
        };
        createdAt: string;
        confirmationUrl?: string;
    };
}

export const useYooKassaPayment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createPayment = useCallback(async (paymentData: PaymentData): Promise<PaymentResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/tokens/purchase/yookassa', {
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

            const result: PaymentResponse = await response.json();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const checkPaymentStatus = useCallback(async (purchaseId: string): Promise<PurchaseStatus> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/tokens/purchase/status/${purchaseId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to check payment status');
            }

            const result: PurchaseStatus = await response.json();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const redirectToPayment = useCallback((confirmationUrl: string) => {
        window.location.href = confirmationUrl;
    }, []);

    return {
        createPayment,
        checkPaymentStatus,
        redirectToPayment,
        loading,
        error,
    };
};

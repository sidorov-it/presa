import React from 'react';
import { FaCreditCard } from 'react-icons/fa';
import styles from './CloudPaymentsPaymentButton.module.css';
import { useTokens } from '@/hooks/useTokens';

interface CloudPaymentsPaymentButtonProps {
    packageId: string;
    onSuccess?: (purchaseId: string) => void;
    onError?: (error: string) => void;
    isLoading?: boolean;
    className?: string;
}

export const CloudPaymentsPaymentButton: React.FC<CloudPaymentsPaymentButtonProps> = ({
    packageId,
    onSuccess,
    onError,
    isLoading = false,
    className = '',
}) => {
    const { createTokensPayment } = useTokens();

    const handlePayment = async () => {
        try {
            const paymentResponse = await createTokensPayment({
                packageId,
                returnUrl: `${window.location.origin}/tokens`,
            });
            if (onSuccess) {
                onSuccess(paymentResponse.purchaseId);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании платежа';
            if (onError) {
                onError(errorMessage);
            }
        }
    };

    const buttonClassName = `${styles.button} ${className}`.trim();

    return (
        <button onClick={handlePayment} disabled={loading || isLoading} className={buttonClassName}>
            {loading || isLoading ? (
                <div className={styles.spinner} />
            ) : (
                <>
                    <FaCreditCard />
                    Купить
                </>
            )}
        </button>
    );
};

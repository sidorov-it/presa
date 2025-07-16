'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCloudPaymentsPayment } from '@/hooks/useCloudPaymentsPayment';
import styles from './PaymentStatus.module.css';

interface PaymentStatusProps {
    purchaseId: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ purchaseId, onSuccess, onError }) => {
    const { checkPaymentStatus, loading, error } = useCloudPaymentsPayment();
    const [status, setStatus] = useState<any>(null);

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const checkStatus = useCallback(async () => {
        try {
            const statusData = await checkPaymentStatus(purchaseId);
            setStatus(statusData);

            // Если платеж завершен, останавливаем опрос
            if (statusData.purchase.status === 'completed') {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                if (onSuccess) {
                    onSuccess();
                }
            } else if (statusData.purchase.status === 'failed' || statusData.purchase.status === 'canceled') {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                if (onError) {
                    onError(`Платеж ${statusData.purchase.status === 'failed' ? 'не удался' : 'был отменен'}`);
                }
            }
        } catch (err) {
            console.error('Error checking payment status:', err);
            if (onError) {
                onError(err instanceof Error ? err.message : 'Ошибка проверки статуса');
            }
        }
    }, [purchaseId, checkPaymentStatus, onSuccess, onError]);

    useEffect(() => {
        // Сразу проверяем статус
        checkStatus();

        // Устанавливаем интервал для опроса статуса каждые 5 секунд
        const interval = setInterval(checkStatus, 5000);
        pollingIntervalRef.current = interval;

        // Очищаем интервал при размонтировании компонента
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [checkStatus]);

    if (loading && !status) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <span>Проверяем статус платежа...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorContent}>
                    <div className={styles.errorIcon}>❌</div>
                    <div className={styles.errorText}>
                        <h3 className={styles.errorTitle}>Ошибка</h3>
                        <p className={styles.errorDescription}>{error}</p>
                    </div>
                </div>
                <Button onClick={() => checkStatus()} variant="outline" size="sm" className={styles.retryButton}>
                    Попробовать снова
                </Button>
            </div>
        );
    }

    if (!status) {
        return null;
    }

    const getStatusInfo = () => {
        switch (status.purchase.status) {
            case 'pending':
                return {
                    icon: '⏳',
                    title: 'Ожидание оплаты',
                    description: 'Платеж создан и ожидает подтверждения',
                    statusClass: styles.statusPending,
                };
            case 'completed':
                return {
                    icon: '✅',
                    title: 'Платеж успешен',
                    description: `Токены (${status.purchase.tokensAmount}) добавлены на ваш счет`,
                    statusClass: styles.statusCompleted,
                };
            case 'failed':
                return {
                    icon: '❌',
                    title: 'Платеж не удался',
                    description: 'Произошла ошибка при обработке платежа',
                    statusClass: styles.statusFailed,
                };
            case 'canceled':
                return {
                    icon: '🚫',
                    title: 'Платеж отменен',
                    description: 'Платеж был отменен',
                    statusClass: styles.statusCanceled,
                };
            default:
                return {
                    icon: '❓',
                    title: 'Неизвестный статус',
                    description: 'Неизвестный статус платежа',
                    statusClass: styles.statusUnknown,
                };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className={`${styles.statusContainer} ${statusInfo.statusClass}`}>
            <div className={styles.statusContent}>
                <div className={styles.statusIcon}>{statusInfo.icon}</div>
                <div className={styles.statusInfo}>
                    <h3 className={styles.statusTitle}>{statusInfo.title}</h3>
                    <p className={styles.statusDescription}>{statusInfo.description}</p>

                    {status.purchase.status === 'pending' && (
                        <div className={styles.pendingInfo}>Автоматическая проверка каждые 5 секунд...</div>
                    )}

                    <div className={styles.details}>
                        <div className={styles.detailItem}>Пакет: {status.purchase.package.name}</div>
                        <div className={styles.detailItem}>
                            Сумма: {status.purchase.price} {status.purchase.currency.toUpperCase()}
                        </div>
                        <div className={styles.detailItem}>Создан: {new Date(status.purchase.createdAt).toLocaleString('ru-RU')}</div>
                        {status.purchase.completedAt && (
                            <div className={styles.detailItem}>Завершен: {new Date(status.purchase.completedAt).toLocaleString('ru-RU')}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}; 
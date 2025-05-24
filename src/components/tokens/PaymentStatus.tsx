'use client';

import React, { useEffect, useState } from 'react';
import { useYooKassaPayment } from '@/hooks/useYooKassaPayment';
import { Button } from '@/components/ui/Button';

interface PaymentStatusProps {
    purchaseId: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
    purchaseId,
    onSuccess,
    onError,
}) => {
    const { checkPaymentStatus, loading, error } = useYooKassaPayment();
    const [status, setStatus] = useState<any>(null);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    const checkStatus = async () => {
        try {
            const statusData = await checkPaymentStatus(purchaseId);
            setStatus(statusData);

            // Если платеж завершен, останавливаем опрос
            if (statusData.purchase.status === 'completed') {
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                }
                if (onSuccess) {
                    onSuccess();
                }
            } else if (statusData.purchase.status === 'failed' || statusData.purchase.status === 'canceled') {
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
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
    };

    useEffect(() => {
        // Сразу проверяем статус
        checkStatus();

        // Устанавливаем интервал для опроса статуса каждые 5 секунд
        const interval = setInterval(checkStatus, 5000);
        setPollingInterval(interval);

        // Очищаем интервал при размонтировании компонента
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [purchaseId]);

    if (loading && !status) {
        return (
            <div className="flex items-center justify-center p-6">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Проверяем статус платежа...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 text-red-600">❌</div>
                    <div>
                        <h3 className="font-medium text-red-800">Ошибка</h3>
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                </div>
                <Button
                    onClick={() => checkStatus()}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                >
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
                    color: 'yellow',
                };
            case 'completed':
                return {
                    icon: '✅',
                    title: 'Платеж успешен',
                    description: `Токены (${status.purchase.tokensAmount}) добавлены на ваш счет`,
                    color: 'green',
                };
            case 'failed':
                return {
                    icon: '❌',
                    title: 'Платеж не удался',
                    description: 'Произошла ошибка при обработке платежа',
                    color: 'red',
                };
            case 'canceled':
                return {
                    icon: '🚫',
                    title: 'Платеж отменен',
                    description: 'Платеж был отменен',
                    color: 'gray',
                };
            default:
                return {
                    icon: '❓',
                    title: 'Неизвестный статус',
                    description: 'Неизвестный статус платежа',
                    color: 'gray',
                };
        }
    };

    const statusInfo = getStatusInfo();
    const colorClasses: { [key: string]: string } = {
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        green: 'bg-green-50 border-green-200 text-green-800',
        red: 'bg-red-50 border-red-200 text-red-800',
        gray: 'bg-gray-50 border-gray-200 text-gray-800',
    };

    return (
        <div className={`border rounded-lg p-4 ${colorClasses[statusInfo.color]}`}>
            <div className="flex items-start gap-3">
                <div className="text-2xl">{statusInfo.icon}</div>
                <div className="flex-1">
                    <h3 className="font-medium">{statusInfo.title}</h3>
                    <p className="text-sm mt-1">{statusInfo.description}</p>
                    
                    {status.purchase.status === 'pending' && (
                        <div className="mt-3 text-xs">
                            Автоматическая проверка каждые 5 секунд...
                        </div>
                    )}
                    
                    <div className="mt-3 text-xs space-y-1">
                        <div>Пакет: {status.purchase.package.name}</div>
                        <div>Сумма: {status.purchase.price} {status.purchase.currency.toUpperCase()}</div>
                        <div>Создан: {new Date(status.purchase.createdAt).toLocaleString('ru-RU')}</div>
                        {status.purchase.completedAt && (
                            <div>Завершен: {new Date(status.purchase.completedAt).toLocaleString('ru-RU')}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}; 
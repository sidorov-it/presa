import React, { useState, useEffect } from 'react';
import {
    FaCrown,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaInfoCircle,
    FaExclamationTriangle,
} from 'react-icons/fa';
import { SubscriptionStatus, UserSubscription } from '@prisma/client';
import styles from './SubscriptionManagement.module.css';

interface SubscriptionManagementProps {
    className?: string;
    subscription: UserSubscription;
    loading: boolean;
    error: string | null;
    refreshSubscriptionStatus: () => Promise<void>;
}

const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

const getIntervalLabel = (interval: string): string => {
    switch (interval) {
        case 'monthly':
            return 'Ежемесячно';
        case 'quarterly':
            return 'Каждые 3 месяца';
        case 'semiannual':
            return 'Каждые 6 месяцев';
        default:
            return interval;
    }
};

const getStatusLabel = (status: string): string => {
    switch (status) {
        case 'active':
            return 'Активна';
        case 'cancelled':
            return 'Отменена';
        case 'expired':
            return 'Истекла';
        case 'pending':
            return 'Ожидает оплаты';
        case 'failed':
            return 'Ошибка оплаты';
        default:
            return status;
    }
};

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'active':
            return '#10b981';
        case 'cancelled':
            return '#f59e0b';
        case 'expired':
            return '#ef4444';
        case 'pending':
            return '#3b82f6';
        case 'failed':
            return '#ef4444';
        default:
            return '#6b7280';
    }
};

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
    className,
    subscription,
    loading,
    error,
    refreshSubscriptionStatus,
}: {
    className?: string;
    subscription: UserSubscription;
    loading: boolean;
    error: string | null;
    refreshSubscriptionStatus: () => Promise<void>;
}) => {
    // const { lastUserSubscription: subscription, loading, error, refreshSubscriptionStatus } = useSubscriptions();
    const [isRestarting, setIsRestarting] = useState(false);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Логируем изменения lastUserSubscription для отладки
    useEffect(() => {
        console.log('SubscriptionManagement: lastUserSubscription changed:', subscription);
    }, [subscription]);

    // Принудительно обновляем состояние при монтировании компонента
    useEffect(() => {
        console.log('SubscriptionManagement: Component mounted, refreshing subscription status');
        refreshSubscriptionStatus();
    }, [refreshSubscriptionStatus]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshSubscriptionStatus();
        setIsRefreshing(false);
    };

    const handleCancelSubscription = async () => {
        if (!subscription) return;

        setIsCancelling(true);
        try {
            const response = await fetch(`/api/subscriptions/${subscription.id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                await refreshSubscriptionStatus();
                setShowCancelConfirm(false);
            } else {
                const errorData = await response.json();
                console.error('Failed to cancel subscription:', errorData);
            }
        } catch (error) {
            console.error('Error cancelling subscription:', error);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleRestartSubscription = async () => {
        if (!subscription) return;
        setIsRestarting(true);
        try {
            const response = await fetch(`/api/subscriptions/${subscription.id}/restart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                await refreshSubscriptionStatus();
                setIsRestarting(false);
            } else {
                const errorData = await response.json();
                console.error('Failed to restart subscription:', errorData);
            }
        } catch (error) {
            console.error('Error restarting subscription:', error);
        } finally {
            setIsRestarting(false);
        }
    };

    if (loading) {
        return (
            <div className={`${styles.container} ${className || ''}`}>
                <div className={styles.loadingSpinner}></div>
                <p>Загрузка информации о подписке...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.container} ${className || ''}`}>
                <div className={styles.errorMessage}>
                    <FaTimesCircle className={styles.errorIcon} />
                    <span>Ошибка загрузки: {error}</span>
                    <button onClick={handleRefresh} className={styles.retryButton}>
                        Повторить
                    </button>
                </div>
            </div>
        );
    }

    // Show subscription info for any subscription (active, cancelled, expired)
    if (!subscription) {
        return (
            <div className={`${styles.container} ${className || ''}`}>
                <div className={styles.noSubscription}>
                    <FaInfoCircle className={styles.infoIcon} />
                    <h3>У вас нет подписки</h3>
                    <p>Оформите подписку, чтобы получить доступ к расширенным возможностям Presa.</p>
                </div>
            </div>
        );
    }

    // const subscription = lastUserSubscription;
    const plan = subscription.plan;

    if (!plan) {
        return (
            <div className={`${styles.container} ${className || ''}`}>
                <div className={styles.errorMessage}>
                    <FaTimesCircle className={styles.errorIcon} />
                    <span>Информация о подписке недоступна</span>
                </div>
            </div>
        );
    }

    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    const nextBillingDate = subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null;
    const isExpiringSoon = endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days
    const isExpired = subscription.status === SubscriptionStatus.expired || endDate.getTime() < Date.now();
    const isCancelled = subscription.status === SubscriptionStatus.cancelled;
    const canCancel = subscription.status === SubscriptionStatus.active && !isCancelled;

    return (
        <div className={`${styles.container} ${className || ''}`}>
            <div className={`${styles.subscriptionCard} ${styles[subscription.status]}`}>
                <div className={styles.subscriptionHeader}>
                    <div className={styles.subscriptionTitle}>
                        <FaCrown className={styles.crownIcon} />
                        <h2>Ваша подписка</h2>
                    </div>
                    <div
                        className={`${styles.statusBadge} ${styles[subscription.status]}`}
                        style={{ borderColor: getStatusColor(subscription.status) }}
                    >
                        {subscription.status === 'active' && <FaCheckCircle className={styles.statusIcon} />}
                        {(subscription.status === 'cancelled' || subscription.status === 'expired') && (
                            <FaExclamationTriangle className={styles.statusIcon} />
                        )}
                        {subscription.status === 'pending' && <FaInfoCircle className={styles.statusIcon} />}
                        {subscription.status === 'failed' && <FaTimesCircle className={styles.statusIcon} />}
                        {getStatusLabel(subscription.status)}
                    </div>
                </div>

                <div className={styles.subscriptionDetails}>
                    <div className={styles.planInfo}>
                        <h3 className={styles.planName}>{plan.name}</h3>
                        {plan.description && <p className={styles.planDescription}>{plan.description}</p>}
                        <div className={styles.planPrice}>
                            {formatCurrency(plan.price, plan.currency)} / {getIntervalLabel(plan.interval)}
                        </div>
                    </div>

                    <div className={styles.subscriptionMetadata}>
                        <div className={styles.metadataItem}>
                            <FaCalendarAlt className={styles.metadataIcon} />
                            <div>
                                <span className={styles.metadataLabel}>Дата начала:</span>
                                <span className={styles.metadataValue}>
                                    {startDate.toLocaleDateString('ru-RU', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className={styles.metadataItem}>
                            <FaCalendarAlt className={styles.metadataIcon} />
                            <div>
                                <span className={styles.metadataLabel}>
                                    {isExpired || isCancelled ? 'Дата окончания:' : 'Действует до:'}
                                </span>
                                <span
                                    className={`${styles.metadataValue} ${isExpiringSoon && !isExpired ? styles.expiringSoon : ''} ${isExpired ? styles.expired : ''}`}
                                >
                                    {endDate.toLocaleDateString('ru-RU', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>

                        {nextBillingDate && subscription.status === SubscriptionStatus.active && (
                            <div className={styles.metadataItem}>
                                <FaCalendarAlt className={styles.metadataIcon} />
                                <div>
                                    <span className={styles.metadataLabel}>Следующее списание:</span>
                                    <span className={styles.metadataValue}>
                                        {nextBillingDate.toLocaleDateString('ru-RU', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}

                        {subscription.cancelledAt && (
                            <div className={styles.metadataItem}>
                                <FaCalendarAlt className={styles.metadataIcon} />
                                <div>
                                    <span className={styles.metadataLabel}>Дата отмены:</span>
                                    <span className={styles.metadataValue}>
                                        {new Date(subscription.cancelledAt).toLocaleDateString('ru-RU', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Show features only for active subscriptions */}
                {subscription.status === SubscriptionStatus.active && (
                    <div className={styles.subscriptionFeatures}>
                        <h4>Ваши возможности:</h4>
                        <ul className={styles.featuresList}>
                            <li>
                                <FaCheckCircle className={styles.featureIcon} />
                                До 20 слайдов в презентации
                            </li>
                            <li>
                                <FaCheckCircle className={styles.featureIcon} />
                                Экспорт без водяного знака
                            </li>
                            <li>
                                <FaCheckCircle className={styles.featureIcon} />
                                Увеличенный лимит загрузки документов (50 МБ)
                            </li>
                            <li>
                                <FaCheckCircle className={styles.featureIcon} />
                                Приоритетная обработка AI-запросов
                            </li>
                            <li>
                                <FaCheckCircle className={styles.featureIcon} />
                                Все возможности экспорта
                            </li>
                        </ul>
                    </div>
                )}

                <div className={styles.subscriptionActions}>
                    {/* <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`${styles.refreshButton} ${isRefreshing ? styles.loading : ''}`}
                    >
                        {isRefreshing ? 'Обновление...' : 'Обновить статус'}
                    </button> */}

                    {canCancel && (
                        <button
                            onClick={() => setShowCancelConfirm(true)}
                            className={styles.cancelButton}
                            disabled={isCancelling}
                        >
                            Отменить подписку
                        </button>
                    )}

                    {isCancelled && (
                        <button
                            onClick={handleRestartSubscription}
                            className={styles.renewButton}
                            disabled={isCancelling}
                        >
                            Продлить подписку
                        </button>
                    )}
                </div>

                {/* Warning messages */}
                {isExpiringSoon && !isExpired && subscription.status === SubscriptionStatus.active && (
                    <div className={styles.expirationWarning}>
                        <FaInfoCircle className={styles.warningIcon} />
                        <span>
                            Ваша подписка истекает через{' '}
                            {Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} дней. Продлите
                            подписку, чтобы продолжить пользоваться всеми возможностями.
                        </span>
                    </div>
                )}

                {isCancelled && (
                    <div className={styles.cancelledWarning}>
                        <FaExclamationTriangle className={styles.warningIcon} />
                        <span>
                            Подписка отменена. Вы можете пользоваться всеми возможностями до{' '}
                            {endDate.toLocaleDateString('ru-RU')}.
                        </span>
                    </div>
                )}

                {isExpired && (
                    <div className={styles.expiredWarning}>
                        <FaTimesCircle className={styles.warningIcon} />
                        <span>
                            Срок действия подписки истек. Для получения доступа к расширенным возможностям оформите
                            новую подписку.
                        </span>
                    </div>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Отменить подписку?</h3>
                        <p>
                            После отмены подписки вы сможете пользоваться всеми возможностями до{' '}
                            {endDate.toLocaleDateString('ru-RU')}. Подписку можно будет возобновить в любое время.
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className={styles.modalCancelButton}
                                disabled={isCancelling}
                            >
                                Оставить подписку
                            </button>
                            <button
                                onClick={handleCancelSubscription}
                                className={styles.modalConfirmButton}
                                disabled={isCancelling}
                            >
                                {isCancelling ? 'Отменяем...' : 'Да, отменить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

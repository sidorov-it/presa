import React, { useState, useEffect } from 'react';
import {
    FaCrown,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaInfoCircle,
    FaExclamationTriangle,
    FaUndo,
    FaPlay,
} from 'react-icons/fa';
import { SubscriptionStatus } from '@prisma/client';
import { UserSubscription, SubscriptionPlan } from '@/types/subscriptions';
import styles from './SubscriptionManagement.module.css';

interface SubscriptionManagementProps {
    className?: string;
    subscription: UserSubscription | null;
    loading: boolean;
    error: string | null;
    refreshSubscriptionStatus: () => Promise<void>;
    availablePlans?: SubscriptionPlan[];
}

// Helper functions
const getStatusLabel = (status: SubscriptionStatus): string => {
    switch (status) {
        case 'active':
            return 'Активна';
        case 'pending':
            return 'Ожидает оплаты';
        case 'cancelled':
            return 'Отменена';
        case 'expired':
            return 'Истекла';
        case 'failed':
            return 'Ошибка оплаты';
        case 'scheduled':
            return 'Запланирована';
        default:
            return status;
    }
};

const getStatusColor = (status: SubscriptionStatus): string => {
    switch (status) {
        case 'active':
            return '#10b981';
        case 'pending':
            return '#f59e0b';
        case 'cancelled':
            return '#6b7280';
        case 'expired':
            return '#ef4444';
        case 'failed':
            return '#dc2626';
        case 'scheduled':
            return '#8b5cf6';
        default:
            return '#6b7280';
    }
};

const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount);
};

const getIntervalLabel = (interval: string): string => {
    switch (interval) {
        case 'monthly':
            return 'месяц';
        case 'quarterly':
            return '3 месяца';
        case 'semiannual':
            return '6 месяцев';
        case 'daily':
            return 'день';
        default:
            return interval;
    }
};

const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
    className,
    subscription,
    loading,
    error,
    refreshSubscriptionStatus,
}) => {
    const [isRestarting, setIsRestarting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Принудительно обновляем состояние при монтировании компонента
    useEffect(() => {
        console.log('SubscriptionManagement: Component mounted, refreshing subscription status');
        refreshSubscriptionStatus();
    }, [refreshSubscriptionStatus]);

    const handleRefresh = async () => {
        await refreshSubscriptionStatus();
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

    // Helper function to determine current subscription
    const getCurrentSubscription = (): UserSubscription | null => {
        return subscription;
    };

    const currentSubscription = getCurrentSubscription();

    if (!currentSubscription) {
        return null;
    }

    const plan = currentSubscription.subscriptionPlan;
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

    const startDate = new Date(currentSubscription.startDate);
    const endDate = new Date(currentSubscription.endDate);
    // const nextBillingDate = currentSubscription.nextBillingDate ? new Date(currentSubscription.nextBillingDate) : null;
    const nextBillingDate = currentSubscription.nextBillingDate ? new Date(currentSubscription.nextBillingDate) : null;
    const isExpired = currentSubscription.status === SubscriptionStatus.expired || endDate.getTime() < Date.now();
    const isCancelled = currentSubscription.status === SubscriptionStatus.cancelled;
    const isFailed = currentSubscription.status === SubscriptionStatus.failed;
    const canCancel = currentSubscription.status === SubscriptionStatus.active && !isCancelled;
    // const isAutoRenewalCancelled =
    //     currentSubscription.status === SubscriptionStatus.active && currentSubscription.cancelledAt;
    // const hasNextSubscription = nextSubscription && nextSubscription.planId !== currentSubscription.planId;

    // Determine which scenario we're in
    const isScenario1 = subscription && subscription.status === SubscriptionStatus.active;
    const isScenario2 =
        subscription && subscription.status === SubscriptionStatus.cancelled && endDate.getTime() > Date.now();
    // const isScenario3 = activeSubscription && hasNextSubscription;
    // const isScenario4 = !activeSubscription && lastSubscription && !hasNextSubscription;
    // const isScenario5 = !activeSubscription && lastSubscription && hasNextSubscription;
    // const isScenario7 = activeSubscription && activeSubscription.status === SubscriptionStatus.active && isAutoRenewalCancelled;

    return (
        <div className={`${styles.container} ${className || ''}`}>
            {/* Current / Upcoming Subscription Block */}
            <div className={`${styles.subscriptionCard} ${styles[currentSubscription.status]}`}>
                <div className={styles.subscriptionHeader}>
                    <div className={styles.subscriptionTitle}>
                        <FaCrown className={styles.crownIcon} />
                        <h2>Ваша подписка</h2>
                    </div>
                    <div
                        className={`${styles.statusBadge} ${styles[currentSubscription.status]}`}
                        style={{ borderColor: getStatusColor(currentSubscription.status) }}
                    >
                        {currentSubscription.status === 'active' && <FaCheckCircle className={styles.statusIcon} />}
                        {(currentSubscription.status === 'cancelled' || currentSubscription.status === 'expired') && (
                            <FaExclamationTriangle className={styles.statusIcon} />
                        )}
                        {currentSubscription.status === 'pending' && <FaInfoCircle className={styles.statusIcon} />}
                        {currentSubscription.status === 'failed' && <FaTimesCircle className={styles.statusIcon} />}
                        {getStatusLabel(currentSubscription.status)}
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
                                <span className={styles.metadataValue}>{formatDate(startDate)}</span>
                            </div>
                        </div>

                        <div className={styles.metadataItem}>
                            <FaCalendarAlt className={styles.metadataIcon} />
                            <div>
                                <span className={styles.metadataLabel}>Дата окончания:</span>
                                <span className={styles.metadataValue}>{formatDate(endDate)}</span>
                            </div>
                        </div>

                        {nextBillingDate && currentSubscription.status === 'active' && (
                            <div className={styles.metadataItem}>
                                <FaCalendarAlt className={styles.metadataIcon} />
                                <div>
                                    <span className={styles.metadataLabel}>Следующее списание:</span>
                                    <span className={styles.metadataValue}>{formatDate(nextBillingDate)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scenario-specific messages and actions */}
                {isScenario1 && canCancel && (
                    <div className={styles.subscriptionActions}>
                        {canCancel && (
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className={styles.cancelButton}
                                disabled={isCancelling}
                            >
                                Отменить подписку
                            </button>
                        )}
                    </div>
                )}

                {/* Warning messages */}
                {/* {isExpiringSoon && currentSubscription.status === SubscriptionStatus.active && (
                    <div className={styles.expirationWarning}>
                        <FaExclamationTriangle className={styles.warningIcon} />
                        <div>
                            <strong>Подписка истекает скоро</strong>
                            <br />
                            Ваша подписка истекает {formatDate(endDate)}. Продлите её, чтобы продолжить пользоваться
                            всеми возможностями.
                        </div>
                    </div>
                )} */}

                {isCancelled && (
                    <div className={styles.cancelledWarning}>
                        <FaExclamationTriangle className={styles.warningIcon} />
                        <div>
                            <strong>Подписка отменена</strong>
                            <br />
                            Вы можете пользоваться всеми возможностями до {formatDate(endDate)} После окочания действия
                            подписки, вы сможете продлить её.
                        </div>
                    </div>
                )}

                {isExpired && (
                    <div className={styles.expiredWarning}>
                        <FaExclamationTriangle className={styles.warningIcon} />
                        <div>
                            <strong>Подписка истекла</strong>
                            <br />
                            Ваша подписка истекла {formatDate(endDate)}. Оформите новую подписку, чтобы продолжить
                            пользоваться расширенными возможностями.
                        </div>
                    </div>
                )}

                {isFailed && (
                    <div className={styles.expiredWarning}>
                        <FaTimesCircle className={styles.warningIcon} />
                        <div>
                            <strong>Ошибка оплаты</strong>
                            <br />
                            Произошла ошибка при обработке платежа. Попробуйте повторить оплату или обратитесь в службу
                            поддержки.
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation modals */}
            {showCancelConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Отменить подписку?</h3>
                        <p>
                            После отмены подписки вы сможете пользоваться всеми возможностями до {formatDate(endDate)}
                            Подписку можно будет возобновить в любое время.
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

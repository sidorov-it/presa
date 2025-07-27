import React, { useState, useEffect } from 'react';
import {
    FaCrown,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaInfoCircle,
    FaExclamationTriangle,
    FaExchangeAlt,
    FaUndo,
    FaSync,
    FaPlay,
} from 'react-icons/fa';
import { SubscriptionStatus } from '@prisma/client';
import { UserSubscription, SubscriptionPlan } from '@/types/subscriptions';
import { PlanChangeModal } from '../PlanChangeModal/PlanChangeModal';
import styles from './SubscriptionManagement.module.css';

interface SubscriptionManagementProps {
    className?: string;
    activeSubscription: UserSubscription | null;
    lastSubscription: UserSubscription | null;
    nextSubscription: UserSubscription | null;
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
    activeSubscription,
    lastSubscription,
    nextSubscription,
    loading,
    error,
    refreshSubscriptionStatus,
    availablePlans = [],
}) => {
    const [isRestarting, setIsRestarting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancellingPlanChange, setIsCancellingPlanChange] = useState(false);
    const [isRetryingPayment, setIsRetryingPayment] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
    const [isChangingPlan, setIsChangingPlan] = useState(false);

    // Логируем изменения lastUserSubscription для отладки
    useEffect(() => {
        console.log('SubscriptionManagement: lastUserSubscription changed:', lastSubscription);
    }, [lastSubscription]);

    // Принудительно обновляем состояние при монтировании компонента
    useEffect(() => {
        console.log('SubscriptionManagement: Component mounted, refreshing subscription status');
        refreshSubscriptionStatus();
    }, [refreshSubscriptionStatus]);

    const handleRefresh = async () => {
        await refreshSubscriptionStatus();
    };

    const handleCancelSubscription = async () => {
        if (!activeSubscription) return;

        setIsCancelling(true);
        try {
            const response = await fetch(`/api/subscriptions/${activeSubscription.id}/cancel`, {
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

    const handleCancelPlanChange = async () => {
        if (!activeSubscription) return;
        setIsCancellingPlanChange(true);
        try {
            const response = await fetch(`/api/subscriptions/${activeSubscription.id}/cancel-plan-change`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                await refreshSubscriptionStatus();
            } else {
                const errorData = await response.json();
                console.error('Failed to cancel plan change:', errorData);
            }
        } catch (error) {
            console.error('Error cancelling plan change:', error);
        } finally {
            setIsCancellingPlanChange(false);
        }
    };

    const handleRetryPayment = async () => {
        if (!activeSubscription) return;
        setIsRetryingPayment(true);
        try {
            const response = await fetch(`/api/subscriptions/${activeSubscription.id}/retry-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.paymentData) {
                    // Open CloudPayments widget for retry payment
                    if (window.cp?.CloudPayments) {
                        const cp = new window.cp.CloudPayments();
                        const paymentParams = {
                            publicId: result.paymentData.cloudpaymentsData.publicId,
                            description: result.paymentData.description,
                            amount: Number(result.paymentData.amount),
                            currency: result.paymentData.currency.toUpperCase(),
                            invoiceId: result.paymentData.subscriptionId,
                            accountId: activeSubscription.userId,
                            skin: 'modern',
                            autoClose: 3,
                            data: {
                                CloudPayments: {
                                    CustomerReceipt: result.paymentData.recurrentData.receipt,
                                    recurrent: {
                                        interval: result.paymentData.recurrentData.interval,
                                        period: result.paymentData.recurrentData.period,
                                        amount: result.paymentData.recurrentData.amount,
                                        startDate: result.paymentData.recurrentData.startDate,
                                        maxPeriods: result.paymentData.recurrentData.maxPeriods,
                                        customerReceipt: result.paymentData.recurrentData.receipt,
                                    },
                                },
                                subscriptionId: result.paymentData.subscriptionId,
                                planId: activeSubscription.planId,
                                userId: activeSubscription.userId,
                            },
                        };

                        cp.pay('charge', paymentParams, {
                            onSuccess: function (options: any) {
                                console.log('Retry payment successful:', options);
                                refreshSubscriptionStatus();
                            },
                            onFail: function (reason: any, options: any) {
                                console.error('Retry payment failed:', reason, options);
                            },
                            onComplete: function (paymentResult: any, options: any) {
                                console.log('Retry payment completed:', paymentResult, options);
                            },
                        });
                    }
                }
            } else {
                const errorData = await response.json();
                console.error('Failed to retry payment:', errorData);
            }
        } catch (error) {
            console.error('Error retrying payment:', error);
        } finally {
            setIsRetryingPayment(false);
        }
    };

    const handlePlanChange = async (planId: string, startImmediately: boolean) => {
        setIsChangingPlan(true);
        try {
            const response = await fetch('/api/subscriptions/change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPlanId: planId,
                    startImmediately,
                }),
            });

            if (response.ok) {
                await refreshSubscriptionStatus();
                setShowPlanChangeModal(false);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to change subscription plan');
            }
        } catch (error) {
            console.error('Error changing subscription plan:', error);
            throw error;
        } finally {
            setIsChangingPlan(false);
        }
    };

    const handleStartSubscription = () => {
        // This would typically open a plan selection modal or redirect to subscription page
        console.log('Start subscription clicked');
    };

    const handleResumeSubscription = async () => {
        if (!activeSubscription) return;
        setIsRestarting(true);
        try {
            const response = await fetch('/api/subscriptions/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId: activeSubscription.planId,
                }),
            });
            if (response.ok) {
                await refreshSubscriptionStatus();
            } else {
                const errorData = await response.json();
                console.error('Failed to resume subscription:', errorData);
            }
        } catch (error) {
            console.error('Error resuming subscription:', error);
        } finally {
            setIsRestarting(false);
        }
    };

    const handleRenewSubscription = () => {
        // This would typically open a plan selection modal or redirect to subscription page
        console.log('Renew subscription clicked');
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
        return activeSubscription || lastSubscription;
    };

    const currentSubscription = getCurrentSubscription();

    // Scenario 6: No subscription at all
    if (!currentSubscription) {
        return (
            <div className={`${styles.container} ${className || ''}`}>
                <div className={styles.noSubscription}>
                    <FaInfoCircle className={styles.infoIcon} />
                    <h3>У вас нет активной подписки</h3>
                    <p>Оформите подписку, чтобы получить доступ к расширенным возможностям Presa.</p>
                    <button onClick={handleStartSubscription} className={styles.startSubscriptionButton}>
                        <FaPlay />
                        Начать подписку
                    </button>
                </div>
            </div>
        );
    }

    const plan = currentSubscription.plan;
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
    const nextBillingDate = currentSubscription.nextBillingDate ? new Date(currentSubscription.nextBillingDate) : null;
    const isExpiringSoon = endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days
    const isExpired = currentSubscription.status === SubscriptionStatus.expired || endDate.getTime() < Date.now();
    const isCancelled = currentSubscription.status === SubscriptionStatus.cancelled;
    const isFailed = currentSubscription.status === SubscriptionStatus.failed;
    const canCancel = currentSubscription.status === SubscriptionStatus.active && !isCancelled;
    const hasScheduledPlanChange = currentSubscription.nextPlanId && currentSubscription.nextPlanStartDate;
    const isAutoRenewalCancelled =
        currentSubscription.status === SubscriptionStatus.active && currentSubscription.cancelledAt;
    const hasNextSubscription = nextSubscription && nextSubscription.planId !== currentSubscription.planId;

    // Determine which scenario we're in
    const isScenario1 = activeSubscription && activeSubscription.status === SubscriptionStatus.active && !hasNextSubscription;
    const isScenario2 =
        activeSubscription &&
        activeSubscription.status === SubscriptionStatus.cancelled &&
        endDate.getTime() > Date.now() &&
        !hasNextSubscription;
    const isScenario3 = activeSubscription && hasNextSubscription;
    const isScenario4 = !activeSubscription && lastSubscription && !hasNextSubscription;
    const isScenario5 = !activeSubscription && lastSubscription && hasNextSubscription;
    const isScenario7 = activeSubscription && activeSubscription.status === SubscriptionStatus.active && isAutoRenewalCancelled;

    return (
        <div className={`${styles.container} ${className || ''}`}>
            {/* Current / Upcoming Subscription Block */}
            <div className={`${styles.subscriptionCard} ${styles[currentSubscription.status]}`}>
                <div className={styles.subscriptionHeader}>
                    <div className={styles.subscriptionTitle}>
                        <FaCrown className={styles.crownIcon} />
                        <h2>{isScenario3 || isScenario5 ? 'Текущая подписка' : 'Ваша подписка'}</h2>
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

                        {nextBillingDate && (
                            <div className={styles.metadataItem}>
                                <FaCalendarAlt className={styles.metadataIcon} />
                                <div>
                                    <span className={styles.metadataLabel}>Следующее списание:</span>
                                    <span className={styles.metadataValue}>{formatDate(nextBillingDate)}</span>
                                </div>
                            </div>
                        )}

                        {hasScheduledPlanChange && currentSubscription.nextPlanStartDate && (
                            <div className={styles.metadataItem}>
                                <FaExchangeAlt className={styles.metadataIcon} />
                                <div>
                                    <span className={styles.metadataLabel}>Запланированное изменение:</span>
                                    <span className={styles.metadataValue}>
                                        {formatDate(currentSubscription.nextPlanStartDate)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scenario-specific messages and actions */}
                {isScenario1 && (
                    <div className={styles.subscriptionActions}>
                        <div className={styles.statusMessage}>Ваша подписка активна до {formatDate(endDate)}</div>
                        {availablePlans.length > 0 && (
                            <button
                                onClick={() => setShowPlanChangeModal(true)}
                                className={styles.changePlanButton}
                                disabled={isChangingPlan}
                            >
                                <FaExchangeAlt />
                                Изменить план
                            </button>
                        )}
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

                {isScenario2 && (
                    <div className={styles.subscriptionActions}>
                        <div className={styles.statusMessage}>
                            Ваша подписка была отменена и закончится {formatDate(endDate)}
                        </div>
                        <button
                            onClick={handleResumeSubscription}
                            className={styles.renewButton}
                            disabled={isRestarting}
                        >
                            <FaUndo />
                            {isRestarting ? 'Возобновляем...' : 'Возобновить подписку'}
                        </button>
                        {availablePlans.length > 0 && (
                            <button
                                onClick={() => setShowPlanChangeModal(true)}
                                className={styles.changePlanButton}
                                disabled={isChangingPlan}
                            >
                                <FaExchangeAlt />
                                Изменить план
                            </button>
                        )}
                    </div>
                )}

                {isScenario3 && (
                    <div className={styles.subscriptionActions}>
                        <div className={styles.statusMessage}>Ваша подписка активна до {formatDate(endDate)}</div>
                        {availablePlans.length > 0 && (
                            <button
                                onClick={() => setShowPlanChangeModal(true)}
                                className={styles.changePlanButton}
                                disabled={isChangingPlan}
                            >
                                <FaExchangeAlt />
                                Изменить будущий план
                            </button>
                        )}
                        {hasScheduledPlanChange && (
                            <button
                                onClick={handleCancelPlanChange}
                                className={styles.cancelPlanChangeButton}
                                disabled={isCancellingPlanChange}
                            >
                                <FaTimesCircle />
                                {isCancellingPlanChange ? 'Отменяем...' : 'Отменить изменение плана'}
                            </button>
                        )}
                    </div>
                )}

                {isScenario4 && (
                    <div className={styles.subscriptionActions}>
                        <div className={styles.statusMessage}>Ваша подписка истекла {formatDate(endDate)}</div>
                        <button onClick={handleRenewSubscription} className={styles.renewButton}>
                            <FaUndo />
                            Продлить подписку
                        </button>
                    </div>
                )}

                {isScenario5 && (
                    <div className={styles.subscriptionActions}>
                        <div className={styles.statusMessage}>
                            Ваша предыдущая подписка истекла {formatDate(endDate)}
                        </div>
                        {availablePlans.length > 0 && (
                            <button
                                onClick={() => setShowPlanChangeModal(true)}
                                className={styles.changePlanButton}
                                disabled={isChangingPlan}
                            >
                                <FaExchangeAlt />
                                Изменить будущий план
                            </button>
                        )}
                        {hasScheduledPlanChange && (
                            <button
                                onClick={handleCancelPlanChange}
                                className={styles.cancelPlanChangeButton}
                                disabled={isCancellingPlanChange}
                            >
                                <FaTimesCircle />
                                {isCancellingPlanChange ? 'Отменяем...' : 'Отменить изменение плана'}
                            </button>
                        )}
                    </div>
                )}

                {isScenario7 && (
                    <div className={styles.subscriptionActions}>
                        <div className={styles.statusMessage}>
                            Подписка активна до {formatDate(endDate)}, но автопродление отменено
                        </div>
                        <button
                            onClick={handleResumeSubscription}
                            className={styles.renewButton}
                            disabled={isRestarting}
                        >
                            <FaUndo />
                            {isRestarting ? 'Возобновляем...' : 'Возобновить подписку'}
                        </button>
                    </div>
                )}

                {/* Common actions for other scenarios */}
                {!isScenario1 && !isScenario2 && !isScenario3 && !isScenario4 && !isScenario5 && !isScenario7 && (
                    <div className={styles.subscriptionActions}>
                        {isFailed && (
                            <button
                                onClick={handleRetryPayment}
                                className={styles.retryButton}
                                disabled={isRetryingPayment}
                            >
                                <FaSync className={isRetryingPayment ? styles.spinning : ''} />
                                {isRetryingPayment ? 'Повторяем...' : 'Повторить оплату'}
                            </button>
                        )}
                    </div>
                )}

                {/* Warning messages */}
                {isExpiringSoon && currentSubscription.status === SubscriptionStatus.active && (
                    <div className={styles.expirationWarning}>
                        <FaExclamationTriangle className={styles.warningIcon} />
                        <div>
                            <strong>Подписка истекает скоро</strong>
                            <br />
                            Ваша подписка истекает {formatDate(endDate)}. Продлите её, чтобы продолжить пользоваться
                            всеми возможностями.
                        </div>
                    </div>
                )}

                {isCancelled && (
                    <div className={styles.cancelledWarning}>
                        <FaExclamationTriangle className={styles.warningIcon} />
                        <div>
                            <strong>Подписка отменена</strong>
                            <br />
                            Вы можете пользоваться всеми возможностями до {formatDate(endDate)}. После этого подписка
                            будет приостановлена.
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

                {hasScheduledPlanChange && currentSubscription.nextPlanStartDate && (
                    <div className={styles.expirationWarning}>
                        <FaInfoCircle className={styles.warningIcon} />
                        <div>
                            <strong>Изменение плана запланировано</strong>
                            <br />
                            Ваш план будет изменен {formatDate(currentSubscription.nextPlanStartDate)}. Вы можете
                            отменить это изменение в любое время.
                        </div>
                    </div>
                )}
            </div>

            {/* Upcoming Plan Block for Scenarios 3 and 5 */}
            {(isScenario3 || isScenario5) && nextSubscription && nextSubscription.plan && (
                <div className={`${styles.subscriptionCard} ${styles.upcoming}`}>
                    <div className={styles.subscriptionHeader}>
                        <div className={styles.subscriptionTitle}>
                            <FaCalendarAlt className={styles.crownIcon} />
                            <h2>Будущий план</h2>
                        </div>
                        <div className={`${styles.statusBadge} ${styles.pending}`}>
                            <FaInfoCircle className={styles.statusIcon} />
                            Запланирован
                        </div>
                    </div>

                    <div className={styles.subscriptionDetails}>
                        <div className={styles.planInfo}>
                            <h3 className={styles.planName}>{nextSubscription.plan.name}</h3>
                            {nextSubscription.plan.description && (
                                <p className={styles.planDescription}>{nextSubscription.plan.description}</p>
                            )}
                            <div className={styles.planPrice}>
                                {formatCurrency(nextSubscription.plan.price, nextSubscription.plan.currency)} /{' '}
                                {getIntervalLabel(nextSubscription.plan.interval)}
                            </div>
                        </div>

                        <div className={styles.subscriptionMetadata}>
                            <div className={styles.metadataItem}>
                                <FaCalendarAlt className={styles.metadataIcon} />
                                <div>
                                    <span className={styles.metadataLabel}>Начинается:</span>
                                    <span className={styles.metadataValue}>
                                        {formatDate(nextSubscription.startDate)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.subscriptionActions}>
                        <div className={styles.statusMessage}>
                            {isScenario3
                                ? `Новый план ('${nextSubscription.plan.name}') начнется ${formatDate(
                                      nextSubscription.startDate
                                  )}`
                                : `Новый план ('${nextSubscription.plan.name}') начнется ${formatDate(
                                      nextSubscription.startDate
                                  )}`}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation modals */}
            {showCancelConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Отменить подписку?</h3>
                        <p>
                            После отмены подписки вы сможете пользоваться всеми возможностями до {formatDate(endDate)}.
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

            {showPlanChangeModal && activeSubscription?.plan && (
                <PlanChangeModal
                    isOpen={showPlanChangeModal}
                    onClose={() => setShowPlanChangeModal(false)}
                    currentPlan={activeSubscription.plan}
                    availablePlans={availablePlans}
                    onPlanChange={handlePlanChange}
                    loading={isChangingPlan}
                />
            )}
        </div>
    );
};

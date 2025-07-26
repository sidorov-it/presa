import React, { useState } from 'react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { FaCrown, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import styles from './SubscriptionManagement.module.css';

interface SubscriptionManagementProps {
    className?: string;
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

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ className }) => {
    const { userSubscription, hasActiveSubscription, loading, error, refreshSubscriptionStatus } = useSubscriptions();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshSubscriptionStatus();
        setIsRefreshing(false);
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

    if (!hasActiveSubscription || !userSubscription) {
        return (
            <div className={`${styles.container} ${className || ''}`}>
                <div className={styles.noSubscription}>
                    <FaInfoCircle className={styles.infoIcon} />
                    <h3>У вас нет активной подписки</h3>
                    <p>Оформите подписку, чтобы получить доступ к расширенным возможностям Presa.</p>
                    <a href="/tokens" className={styles.subscribeButton}>
                        Выбрать подписку
                    </a>
                </div>
            </div>
        );
    }

    const subscription = userSubscription;
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

    const endDate = new Date(subscription.endDate);
    const nextBillingDate = subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null;
    const isExpiringSoon = endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

    return (
        <div className={`${styles.container} ${className || ''}`}>
            <div className={styles.subscriptionCard}>
                <div className={styles.subscriptionHeader}>
                    <div className={styles.subscriptionTitle}>
                        <FaCrown className={styles.crownIcon} />
                        <h2>Активная подписка</h2>
                    </div>
                    <div className={`${styles.statusBadge} ${styles[subscription.status]}`}>
                        <FaCheckCircle className={styles.statusIcon} />
                        {getStatusLabel(subscription.status)}
                    </div>
                </div>

                <div className={styles.subscriptionDetails}>
                    <div className={styles.planInfo}>
                        <h3 className={styles.planName}>{plan.name}</h3>
                        {plan.description && (
                            <p className={styles.planDescription}>{plan.description}</p>
                        )}
                        <div className={styles.planPrice}>
                            {formatCurrency(plan.price, plan.currency)} / {getIntervalLabel(plan.interval)}
                        </div>
                    </div>

                    <div className={styles.subscriptionMetadata}>
                        <div className={styles.metadataItem}>
                            <FaCalendarAlt className={styles.metadataIcon} />
                            <div>
                                <span className={styles.metadataLabel}>Действует до:</span>
                                <span className={`${styles.metadataValue} ${isExpiringSoon ? styles.expiringSoon : ''}`}>
                                    {endDate.toLocaleDateString('ru-RU', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>

                        {nextBillingDate && (
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
                    </div>
                </div>

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

                <div className={styles.subscriptionActions}>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`${styles.refreshButton} ${isRefreshing ? styles.loading : ''}`}
                    >
                        {isRefreshing ? 'Обновление...' : 'Обновить статус'}
                    </button>
                    
                    <a href="/tokens" className={styles.manageButton}>
                        Управление подпиской
                    </a>
                </div>

                {isExpiringSoon && (
                    <div className={styles.expirationWarning}>
                        <FaInfoCircle className={styles.warningIcon} />
                        <span>
                            Ваша подписка истекает через{' '}
                            {Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} дней.
                            Продлите подписку, чтобы продолжить пользоваться всеми возможностями.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}; 
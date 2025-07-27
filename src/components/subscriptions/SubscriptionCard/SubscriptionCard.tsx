import React from 'react';
import { SubscriptionPlan } from '@/types/subscriptions';
import { FaCrown, FaCheckCircle } from 'react-icons/fa';
import styles from './SubscriptionCard.module.css';

interface SubscriptionCardProps {
    plan: SubscriptionPlan;
    onSubscribe: (planId: string) => void;
    isLoading: boolean;
    isActive?: boolean;
}

const getIntervalLabel = (interval: string): string => {
    switch (interval) {
        case 'monthly':
            return 'в месяц';
        case 'quarterly':
            return 'за 3 месяца';
        case 'semiannual':
            return 'за 6 месяцев';
        default:
            return '';
    }
};

const getIntervalDiscount = (interval: string): string | null => {
    switch (interval) {
        case 'quarterly':
            return 'Скидка 10%';
        case 'semiannual':
            return 'Скидка 20%';
        default:
            return null;
    }
};


export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
    plan,
    onSubscribe,
    isLoading,
    isActive = false,
}) => {
    const handleSubscribe = () => {
        if (!isLoading && !isActive) {
            onSubscribe(plan.id);
        }
    };

    const intervalLabel = getIntervalLabel(plan.interval);
    const discount = getIntervalDiscount(plan.interval);
    return (
        <div
            className={`${styles.subscriptionCard} ${plan.isPopular ? styles.popular : ''} ${isActive ? styles.active : ''}`}
        >
            {plan.isPopular && (
                <div className={styles.popularBadge}>
                    <FaCrown className={styles.crownIcon} />
                    Популярный
                </div>
            )}

            {discount && <div className={styles.discountBadge}>{discount}</div>}

            <div className={styles.cardHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                {plan.description && <p className={styles.planDescription}>{plan.description}</p>}
            </div>

            <div className={styles.priceSection}>
                <div className={styles.price}>
                    <span className={styles.amount}>{plan.price}</span>
                    <span className={styles.currency}>₽</span>
                </div>
                <div className={styles.interval}>{intervalLabel}</div>
            </div>



            <div className={styles.actionSection}>
                {isActive ? (
                    <div className={styles.activeStatus}>
                        <FaCheckCircle className={styles.activeIcon} />
                        Активная подписка
                    </div>
                ) : (
                    <button
                        onClick={handleSubscribe}
                        disabled={isLoading}
                        className={`${styles.subscribeButton} ${isLoading ? styles.loading : ''}`}
                    >
                        {isLoading ? 'Обработка...' : `Подписаться`}
                    </button>
                )}
            </div>
        </div>
    );
};

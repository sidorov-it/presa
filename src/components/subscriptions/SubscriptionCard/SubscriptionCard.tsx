import React from 'react';
import { SubscriptionPlan } from '@/types/subscriptions';
import { FaCheckCircle, FaCreditCard } from 'react-icons/fa';
import { Card } from '@/components/ui/Card/Card';
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

    return (
        <Card isPopular={plan.isPopular} className={`${isActive ? styles.active : ''}`}>
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
                        {isLoading ? (
                            'Обработка...'
                        ) : (
                            <div className={styles.subscribeButtonContent}>
                                <FaCreditCard />
                                Оформить
                            </div>
                        )}
                    </button>
                )}
            </div>
        </Card>
    );
};

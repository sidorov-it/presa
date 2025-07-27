import React, { useState, useEffect } from 'react';
import { FaCrown, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import { SubscriptionPlan } from '@/types/subscriptions';
import styles from './PlanChangeModal.module.css';
import { formatDate } from '@/utils/helpers';

interface PlanChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: SubscriptionPlan;
    availablePlans: SubscriptionPlan[];
    onPlanChange: (planId: string, startImmediately: boolean) => Promise<void>;
    loading: boolean;
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

export const PlanChangeModal: React.FC<PlanChangeModalProps> = ({
    isOpen,
    onClose,
    currentPlan,
    availablePlans,
    onPlanChange,
    loading,
}) => {
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [startImmediately, setStartImmediately] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedPlanId('');
            setStartImmediately(false);
            setError(null);
        }
    }, [isOpen]);

    const handlePlanChange = async () => {
        if (!selectedPlanId) {
            setError('Пожалуйста, выберите план');
            return;
        }

        try {
            setError(null);
            await onPlanChange(selectedPlanId, startImmediately);
            onClose();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Произошла ошибка при изменении плана');
        }
    };

    const selectedPlan = availablePlans.find(plan => plan.id === selectedPlanId);
    const isUpgrade = selectedPlan && selectedPlan.price > currentPlan.price;
    const isDowngrade = selectedPlan && selectedPlan.price < currentPlan.price;

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        <FaCrown className={styles.crownIcon} />
                        Изменить план подписки
                    </h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <FaTimesCircle />
                    </button>
                </div>

                <div className={styles.currentPlanSection}>
                    <h3>Текущий план</h3>
                    <div className={styles.currentPlanCard}>
                        <div className={styles.planInfo}>
                            <h4>{currentPlan.name}</h4>
                            <p>{currentPlan.description}</p>
                            <div className={styles.planPrice}>
                                {formatCurrency(currentPlan.price, currentPlan.currency)} / {getIntervalLabel(currentPlan.interval)}
                            </div>
                        </div>
                        <div className={styles.currentBadge}>
                            <FaCheckCircle />
                            Текущий
                        </div>
                    </div>
                </div>

                <div className={styles.plansSection}>
                    <h3>Выберите новый план</h3>
                    <div className={styles.plansDescription}>
                        <p>Новая подписка начнет действовать после окончания текущей</p>
                    </div>
                    <div className={styles.plansGrid}>
                        {availablePlans.map(plan => (
                            <div
                                key={plan.id}
                                className={`${styles.planCard} ${selectedPlanId === plan.id ? styles.selected : ''} ${
                                    plan.id === currentPlan.id ? styles.current : ''
                                }`}
                                onClick={() => setSelectedPlanId(plan.id)}
                            >
                                <div className={styles.planHeader}>
                                    <h4>{plan.name}</h4>
                                    {plan.isPopular && <span className={styles.popularBadge}>Популярный</span>}
                                </div>
                                <p>{plan.description}</p>
                                <div className={styles.planPrice}>
                                    {formatCurrency(plan.price, plan.currency)} / {getIntervalLabel(plan.interval)}
                                </div>
                                {plan.id === currentPlan.id && (
                                    <div className={styles.currentIndicator}>
                                        <FaCheckCircle />
                                        Текущий план
                                    </div>
                                )}
                                {selectedPlanId === plan.id && plan.id !== currentPlan.id && (
                                    <div className={styles.selectedIndicator}>
                                        <FaCheckCircle />
                                        Выбран
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        <FaTimesCircle />
                        <span>{error}</span>
                    </div>
                )}

                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.cancelButton} disabled={loading}>
                        Отмена
                    </button>
                    <button
                        onClick={handlePlanChange}
                        className={styles.confirmButton}
                        disabled={loading || !selectedPlanId || selectedPlanId === currentPlan.id}
                    >
                        {loading ? 'Изменяем...' : 'Изменить план'}
                    </button>
                </div>
            </div>
        </div>
    );
}; 
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTokens } from '@/hooks/useTokens';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { FaCoins, FaCheckCircle, FaTimesCircle, FaChevronDown, FaChevronUp, FaCrown } from 'react-icons/fa';
import { PaymentStatus } from '@/components/tokens/PaymentStatus';
import { Heading } from '@/components/ui/heading';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { SubscriptionFeatures } from '@/components/subscriptions/SubscriptionFeatures';
import { SubscriptionManagement } from '@/components/subscriptions/SubscriptionManagement';
import { TokenPackageCard } from '@/components/tokens/TokenPackageCard/TokenPackageCard';
import styles from './page.module.css';

const Tokens = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const { balance, loading: tokensLoading, packages, refreshBalance } = useTokens();
    const {
        plans,
        activeSubscription,
        lastActiveSubscription,
        nextSubscription,
        hasActiveSubscription,
        loading: subscriptionLoading,
        createSubscription,
        refreshSubscriptionStatus,
    } = useSubscriptions();

    const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);

    // Check for purchase ID in URL for tracking status
    useEffect(() => {
        const purchaseId = searchParams.get('purchase');
        if (purchaseId) {
            setActivePurchaseId(purchaseId);
        }
    }, [searchParams]);

    const handleTokenPurchase = (purchaseId: string) => {
        setActivePurchaseId(purchaseId);
    };

    const handleSubscriptionPurchase = async (planId: string) => {
        if (!session?.user) {
            setNotification({
                type: 'error',
                message: 'Необходимо войти в систему для оформления подписки',
            });
            return;
        }

        try {
            const result = await createSubscription(planId);

            if (result.success && result.paymentData) {
                // Open CloudPayments widget for subscription with recurrent support
                if (window.cp?.CloudPayments) {
                    const cp = new window.cp.CloudPayments();

                    const paymentParams = {
                        publicId: result.paymentData.cloudpaymentsData.publicId,
                        description: result.paymentData.description,
                        amount: Number(result.paymentData.amount),
                        currency: result.paymentData.currency.toUpperCase(),
                        invoiceId: result.paymentData.subscriptionId,
                        accountId: session.user.id || '',
                        skin: 'modern',
                        autoClose: 3,
                        data: {
                            CloudPayments: {
                                CustomerReceipt: result.paymentData.recurrentData.receipt, // чек для первого платежа
                                recurrent: {
                                    interval: result.paymentData.recurrentData.interval, // 'Month'
                                    period: result.paymentData.recurrentData.period, // 1, 3, или 6
                                    amount: result.paymentData.recurrentData.amount,
                                    startDate: result.paymentData.recurrentData.startDate,
                                    maxPeriods: result.paymentData.recurrentData.maxPeriods,
                                    customerReceipt: result.paymentData.recurrentData.receipt, // чек для регулярных платежей
                                },
                            },
                            subscriptionId: result.paymentData.subscriptionId,
                            planId: planId,
                            userId: session.user.id,
                        },
                    };

                    console.debug('CloudPayments payment params:', paymentParams);

                    cp.pay('charge', paymentParams, {
                        onSuccess: function (options: any) {
                            console.log('Subscription payment successful:', options);
                            setNotification({
                                type: 'success',
                                message: 'Подписка успешно оформлена! Автоматические списания активированы.',
                            });
                            // Принудительно обновляем состояние подписки
                            setTimeout(() => {
                                refreshSubscriptionStatus();
                            }, 1000);
                        },
                        onFail: function (reason: any, options: any) {
                            console.error('Subscription payment failed:', reason, options);
                            setNotification({
                                type: 'error',
                                message: 'Ошибка при оплате подписки',
                            });
                        },
                        onComplete: function (paymentResult: any, options: any) {
                            console.log('Subscription payment completed:', paymentResult, options);
                        },
                    });
                } else {
                    throw new Error('CloudPayments widget not loaded');
                }
            } else {
                throw new Error(result.error || 'Failed to create subscription');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            setNotification({
                type: 'error',
                message: error instanceof Error ? error.message : 'Ошибка при создании подписки',
            });
        }
    };

    const handlePaymentSuccess = () => {
        setActivePurchaseId(null);
        setNotification({
            type: 'success',
            message: 'Оплата прошла успешно! Токены добавлены на ваш баланс.',
        });

        refreshBalance();
        router.replace('/tokens');
        setTimeout(() => setNotification(null), 5000);
    };

    const handlePaymentError = (error: string) => {
        setActivePurchaseId(null);
        setNotification({
            type: 'error',
            message: error,
        });

        router.replace('/tokens');
        setTimeout(() => setNotification(null), 5000);
    };

    const handleAccordionToggle = () => {
        setIsAccordionOpen(!isAccordionOpen);
    };

    const loading = tokensLoading || subscriptionLoading;

    if (loading && !plans.length && !packages.length) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinnerLarge}></div>
            </div>
        );
    }

    // Determine if we should show subscription plans
    const shouldShowSubscriptionPlans = !hasActiveSubscription && plans.length > 0;

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <Heading
                        title="Токены и подписки"
                        description="Управляйте своими токенами и подпиской для доступа к AI-функциям"
                    />
                </div>

                {/* Notifications */}
                {notification && (
                    <div className={`${styles.notification} ${styles[notification.type]}`}>
                        <div className={styles.notificationIcon}>
                            {notification.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
                        </div>
                        <span>{notification.message}</span>
                        <button onClick={() => setNotification(null)} className={styles.notificationClose}>
                            ×
                        </button>
                    </div>
                )}

                {/* Payment Status */}
                {activePurchaseId && (
                    <div className={styles.paymentStatusCard}>
                        <h2 className={styles.sectionTitle}>Статус платежа</h2>
                        <PaymentStatus
                            purchaseId={activePurchaseId}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                        />
                    </div>
                )}

                {/* Subscription Status Management - Show for any subscription state */}
                {activeSubscription && (
                    <div className={styles.subscriptionManagementSection}>
                        <SubscriptionManagement
                            activeSubscription={activeSubscription}
                            lastSubscription={lastActiveSubscription}
                            nextSubscription={nextSubscription}
                            loading={subscriptionLoading}
                            error={null}
                            refreshSubscriptionStatus={refreshSubscriptionStatus}
                            availablePlans={plans}
                        />
                    </div>
                )}

                {/* Current Token Balance */}
                <div className={styles.balanceCard}>
                    <div className={styles.balanceContent}>
                        <div className={styles.balanceLeft}>
                            <h2 className={styles.balanceTitle}>Текущий баланс токенов</h2>
                            <div className={styles.balanceAmount}>
                                <FaCoins className={styles.balanceIcon} />
                                <span className={styles.balanceNumber}>{formatTokenAmount(balance)}</span>
                                <span className={styles.balanceUnit}>токенов</span>
                            </div>
                        </div>
                        <div className={styles.balanceRight}>
                            <p className={styles.usageLabel}>Примерное использование:</p>
                            <p className={styles.usageAmount}>~{Math.floor(balance / 5)} слайдов</p>
                        </div>
                    </div>
                </div>

                {/* Subscription Plans Section - Only show if user doesn't have active subscription */}
                {shouldShowSubscriptionPlans && (
                    <div className={styles.subscriptionsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <FaCrown className={styles.sectionIcon} />
                                Планы подписки
                            </h2>
                            <div className={styles.recommendedBadge}>Рекомендуем</div>
                        </div>
                        <p className={styles.sectionDescription}>
                            Подписка дает доступ к расширенным возможностям и снимает лимиты
                        </p>
                        <SubscriptionFeatures />
                        <div className={styles.subscriptionsGrid}>
                            {plans.map(plan => (
                                <SubscriptionCard
                                    key={plan.id}
                                    plan={plan}
                                    onSubscribe={handleSubscriptionPurchase}
                                    isLoading={subscriptionLoading}
                                    isActive={false}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Token Packages Section - Always show */}
                <div className={styles.packagesSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <FaCoins className={styles.sectionIcon} />
                            Пакеты токенов
                        </h2>
                    </div>
                    <p className={styles.sectionDescription}>Токены используются для AI-генерации контента и слайдов</p>
                    <div className={styles.packagesGrid}>
                        {packages.map(pkg => (
                            <TokenPackageCard
                                key={pkg.id}
                                package={pkg}
                                onPurchase={handleTokenPurchase}
                                isLoading={false}
                            />
                        ))}
                    </div>
                </div>

                {/* Info about tokens and subscriptions */}
                <div className={styles.infoCard}>
                    <button
                        className={styles.accordionHeader}
                        onClick={handleAccordionToggle}
                        aria-expanded={isAccordionOpen}
                        aria-controls="tokens-info-content"
                    >
                        <h2 className={styles.infoTitle}>Что выбрать: токены или подписку?</h2>
                        <div className={styles.accordionIcon}>
                            {isAccordionOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                    </button>
                    <div
                        id="tokens-info-content"
                        className={`${styles.accordionContent} ${isAccordionOpen ? styles.accordionContentOpen : ''}`}
                    >
                        <div className={styles.comparisonGrid}>
                            <div className={styles.comparisonColumn}>
                                <h3>🎯 Подписка</h3>
                                <p>Лучший выбор для регулярного использования</p>
                                <ul>
                                    <li>• Генерируйте до 20 слайдов при генерации презентации ИИ</li>
                                    <li>• Без водяного знака при экспорте</li>
                                    <li>• Увеличенный лимит загрузки документов</li>
                                    <li>• Приоритетная обработка AI-запросов</li>
                                    <li>• Экономия до 20% при долгосрочных планах</li>
                                </ul>
                            </div>
                            <div className={styles.comparisonColumn}>
                                <h3>💎 Токены</h3>
                                <p>Гибкий вариант для нерегулярного использования</p>
                                <ul>
                                    <li>• Платите только за то, что используете</li>
                                    <li>• Токены не сгорают</li>
                                    <li>• Подходит для разовых проектов</li>
                                    <li>• Можно купить в любой момент</li>
                                    <li>• Нет ежемесячных обязательств</li>
                                </ul>
                            </div>
                        </div>
                        <p className={styles.infoText}>
                            Совершая покупку, пользователь соглашается с{' '}
                            <a
                                href="https://slydle.ru/offer.html"
                                className={styles.infoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                условиями публичной оферты
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tokens;

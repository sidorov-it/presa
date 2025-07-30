'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTokens } from '@/hooks/useTokens';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { TokenPackageCard } from '@/components/tokens/TokenPackageCard/TokenPackageCard';
import { Heading } from '@/components/ui/heading';
import { SubscriptionManagement } from '@/components/subscriptions/SubscriptionManagement';
import { FaCoins, FaCrown } from 'react-icons/fa';
import styles from './page.module.css';
import { SubscriptionFeatures } from '@/components/subscriptions/SubscriptionFeatures';
import { SubscriptionPlan } from '@prisma/client';
import { TokenPackage } from '@/types/tokens';

const Subscriptions = ({
    subscriptionPlans,
    tokensPackages,
}: {
    subscriptionPlans: SubscriptionPlan[];
    tokensPackages: TokenPackage[];
}) => {
    // const router = useRouter();
    // const searchParams = useSearchParams();
    const { data: session } = useSession();

    const [dataLoaded, setDataLoaded] = useState(false);

    const { balance, loading: tokensLoading } = useTokens();
    const {
        // plans,
        activeSubscription,
        loading: subsLoading,
        createSubscription,
        refreshSubscriptionStatus,
    } = useSubscriptions();

    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (!tokensLoading && !subsLoading) {
            setDataLoaded(true);
        }
    }, [tokensLoading, subsLoading]);

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
                        publicId: result.publicId,
                        description: result.paymentData.description,
                        amount: Number(result.paymentData.amount),
                        currency: result.paymentData.currency.toUpperCase(),
                        invoiceId: result.paymentData.invoiceId,
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
                            subscriptionId: result.paymentData.userSubscriptionId,
                            planId: planId,
                            userId: session.user.id,
                        },
                    };

                    // const paymentParams = {
                    //     publicId: result.publicId,
                    //     description: result.paymentData.description,
                    //     amount: Number(result.paymentData.amount),
                    //     currency: result.paymentData.currency.toUpperCase(),
                    //     invoiceId: result.paymentData.invoiceId,
                    //     accountId: session.user.id || '',
                    //     skin: 'modern',
                    //     autoClose: 3,
                    //     data: {
                    //         CloudPayments: {
                    //             CustomerReceipt: result.paymentData.recurrentData.receipt, // чек для первого платежа
                    //             recurrent: {
                    //                 interval: result.paymentData.recurrentData.interval, // 'Month'
                    //                 period: result.paymentData.recurrentData.period, // 1, 3, или 6
                    //                 amount: result.paymentData.recurrentData.amount,
                    //                 startDate: result.paymentData.recurrentData.startDate,
                    //                 maxPeriods: result.paymentData.recurrentData.maxPeriods,
                    //                 customerReceipt: result.paymentData.recurrentData.receipt, // чек для регулярных платежей
                    //             },
                    //         },
                    //         userSubscriptionId: result.paymentData.userSubscriptionId,
                    //         planId: result.paymentData.planId,
                    //         userId: session.user.id,
                    //     },
                    // };

                    console.debug('CloudPayments payment params:', paymentParams);

                    cp.pay('charge', paymentParams, {
                        onSuccess: function (options: any) {
                            console.log('Subscription payment successful:', options);
                            setNotification({
                                type: 'success',
                                message: 'Подписка успешно оформлена!',
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

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Heading title="Токены и подписка" description="Управляйте балансом и подпиской" />

                {!dataLoaded && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinnerLarge}></div>
                    </div>
                )}
                {dataLoaded && (
                    <>
                        {notification && (
                            <div className={`${styles.notification} ${styles[notification.type]}`}>
                                {notification.message}
                            </div>
                        )}

                        {/* {activePurchaseId && (
                            <div className={styles.paymentStatusCard}>
                                <h2 className={styles.sectionTitle}>Статус платежа</h2>
                                <PaymentStatus
                                    purchaseId={activePurchaseId}
                                    onSuccess={handlePaymentSuccess}
                                    onError={() => setActivePurchaseId(null)}
                                />
                            </div>
                        )} */}

                        {activeSubscription && activeSubscription.status !== 'expired' && (
                            <SubscriptionManagement
                                subscription={activeSubscription}
                                loading={subsLoading}
                                error={null}
                                refreshSubscriptionStatus={refreshSubscriptionStatus}
                                availablePlans={subscriptionPlans}
                            />
                        )}

                        <div className={styles.balanceCard}>
                            <h2 className={styles.sectionTitle}>Баланс токенов</h2>
                            <div className={styles.balanceAmount}>
                                <FaCoins className={styles.balanceIcon} />
                                {formatTokenAmount(balance)}
                            </div>
                        </div>

                        {(!activeSubscription || activeSubscription.status === 'expired') && (
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
                                    {subscriptionPlans.map(plan => (
                                        <SubscriptionCard
                                            key={plan.id}
                                            plan={plan}
                                            onSubscribe={handleSubscriptionPurchase}
                                            isLoading={subsLoading}
                                            isActive={false}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.packagesSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>
                                    <FaCoins className={styles.sectionIcon} />
                                    Пакеты токенов
                                </h2>
                            </div>
                            <p className={styles.sectionDescription}>
                                Токены используются для AI-генерации контента и слайдов
                            </p>
                            <div className={styles.packagesGrid}>
                                {tokensPackages.map(pkg => (
                                    <TokenPackageCard
                                        key={pkg.id}
                                        package={pkg}
                                        // onPurchase={handleTokenPurchase}
                                        isLoading={false}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Subscriptions;

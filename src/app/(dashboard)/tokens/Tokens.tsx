'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTokens } from '@/hooks/useTokens';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { TokenPackageCard } from '@/components/tokens/TokenPackageCard/TokenPackageCard';
import { Heading } from '@/components/ui/heading';
import { PaymentStatus } from '@/components/tokens/PaymentStatus';
import { FaCoins } from 'react-icons/fa';
import styles from './page.module.css';

const Tokens = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const { balance, loading: tokensLoading, packages, refreshBalance } = useTokens();
    const { plans, activeSubscription, loading: subsLoading, createSubscription, cancelSubscription, refreshSubscriptionStatus } = useSubscriptions();

    const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const purchaseId = searchParams.get('purchase');
        if (purchaseId) {
            setActivePurchaseId(purchaseId);
        }
    }, [searchParams]);

    const handleTokenPurchase = (purchaseId: string) => {
        setActivePurchaseId(purchaseId);
    };

    const handlePaymentSuccess = () => {
        setActivePurchaseId(null);
        refreshBalance();
        router.replace('/tokens');
    };

    const handleSubscriptionBuy = async (planId: string) => {
        if (!session?.user) return;
        const result = await createSubscription(planId);
        if (result.success && result.paymentData && window.cp?.CloudPayments) {
            const cp = new window.cp.CloudPayments();
            cp.pay('charge', {
                ...result.paymentData.cloudpaymentsData,
                data: { subscriptionId: result.paymentData.subscriptionId, planId, userId: session.user.id },
            });
        }
    };

    const handleCancelSubscription = async () => {
        if (!activeSubscription) return;
        await cancelSubscription(activeSubscription.id);
        refreshSubscriptionStatus();
    };

    const loading = tokensLoading || subsLoading;

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Heading title="Токены и подписка" description="Управляйте балансом и подпиской" />

                {notification && (
                    <div className={`${styles.notification} ${styles[notification.type]}`}>{notification.message}</div>
                )}

                {activePurchaseId && (
                    <div className={styles.paymentStatusCard}>
                        <h2 className={styles.sectionTitle}>Статус платежа</h2>
                        <PaymentStatus purchaseId={activePurchaseId} onSuccess={handlePaymentSuccess} onError={() => setActivePurchaseId(null)} />
                    </div>
                )}

                {activeSubscription && activeSubscription.status !== 'expired' ? (
                    <div className={styles.subscriptionInfo}>
                        <p>Ваша подписка активна до {new Date(activeSubscription.endDate).toLocaleDateString('ru-RU')}</p>
                        {activeSubscription.status === 'cancelled' ? (
                            <p>Автопродление отключено</p>
                        ) : (
                            <button onClick={handleCancelSubscription} className={styles.cancelButton} disabled={subsLoading}>Отменить подписку</button>
                        )}
                    </div>
                ) : (
                    <div className={styles.subscriptionsGrid}>
                        {plans.map(plan => (
                            <SubscriptionCard key={plan.id} plan={plan} onSubscribe={handleSubscriptionBuy} isLoading={subsLoading} />
                        ))}
                    </div>
                )}

                <div className={styles.balanceCard}>
                    <h2 className={styles.sectionTitle}>Баланс токенов</h2>
                    <div className={styles.balanceAmount}>
                        <FaCoins className={styles.balanceIcon} />
                        {formatTokenAmount(balance)}
                    </div>
                </div>

                <div className={styles.packagesGrid}>
                    {packages.map(pkg => (
                        <TokenPackageCard key={pkg.id} package={pkg} onPurchase={handleTokenPurchase} isLoading={false} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Tokens;

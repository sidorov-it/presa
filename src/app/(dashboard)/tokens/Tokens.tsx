'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTokens } from '@/hooks/useTokens';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { TokenPackage } from '@/types/tokens';
import { FaCreditCard, FaHistory, FaCoins, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { HiOutlineCreditCard } from 'react-icons/hi2';
import { PaymentStatus } from '@/components/tokens/PaymentStatus';
import styles from './page.module.css';

interface TransactionRowProps {
    transaction: any;
}

const TransactionRow = ({ transaction }: TransactionRowProps) => {
    const isPositive = transaction.amount > 0;
    const date = new Date(transaction.createdAt).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'purchase':
                return 'Покупка';
            case 'usage':
                return 'Использование';
            case 'bonus':
                return 'Бонус';
            case 'refund':
                return 'Возврат';
            default:
                return type;
        }
    };

    return (
        <div className={styles.transactionRow}>
            <div className={styles.transactionLeft}>
                <div
                    className={`${styles.transactionIcon} ${isPositive ? styles.transactionIconPositive : styles.transactionIconNegative}`}
                >
                    <HiOutlineCreditCard />
                </div>
                <div className={styles.transactionDetails}>
                    <p className={styles.transactionDescription}>{transaction.description}</p>
                    <p className={styles.transactionMeta}>
                        {getTypeLabel(transaction.type)} • {date}
                    </p>
                </div>
            </div>
            <div className={styles.transactionRight}>
                <p
                    className={`${styles.transactionAmount} ${isPositive ? styles.transactionAmountPositive : styles.transactionAmountNegative}`}
                >
                    {isPositive ? '+' : ''}
                    {formatTokenAmount(Math.abs(transaction.amount))}
                </p>
                <p className={styles.transactionBalance}>Баланс: {formatTokenAmount(transaction.balanceAfter)}</p>
            </div>
        </div>
    );
};

interface TokenPackageCardProps {
    package: TokenPackage;
    onPurchase: () => void;
    isLoading: boolean;
}
const TokenPackageCard = ({ package: pkg, onPurchase, isLoading }: TokenPackageCardProps) => {
    return (
        <div className={`${styles.packageCard} ${pkg.isPopular ? styles.packageCardPopular : ''}`}>
            {pkg.isPopular && <div className={styles.popularBadge}>Популярный</div>}

            <div className={styles.packageContent}>
                <h3 className={styles.packageName}>{pkg.name}</h3>
                {pkg.description && <p className={styles.packageDescription}>{pkg.description}</p>}

                <div className={styles.packageTokens}>
                    <div className={styles.packageTokensAmount}>
                        <FaCoins className={styles.packageTokensIcon} />
                        <span className={styles.packageTokensNumber}>{formatTokenAmount(pkg.tokens)}</span>
                    </div>
                </div>

                <div className={styles.packagePrice}>{pkg.price}₽</div>

                <button onClick={onPurchase} disabled={isLoading} className={styles.purchaseButton}>
                    {isLoading ? (
                        <div className={styles.loadingSpinner}></div>
                    ) : (
                        <>
                            <FaCreditCard />
                            Оплатить через YooKassa
                        </>
                    )}
                </button>

                <div className={styles.paymentInfo}>
                    <small>Безопасная оплата картой</small>
                </div>
            </div>
        </div>
    );
};

const Tokens = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { balance, loading, packages, transactions, refreshBalance, refreshTransactions, purchaseTokens } =
        useTokens();
    const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
    const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Проверяем, есть ли purchaseId в URL для отслеживания статуса
    useEffect(() => {
        const purchaseId = searchParams.get('purchase');
        if (purchaseId) {
            setActivePurchaseId(purchaseId);
        }
    }, [searchParams]);

    const handlePurchase = async (packageId: string) => {
        setPurchaseLoading(packageId);
        try {
            const paymentData = await purchaseTokens(packageId);

            // Сохраняем ID покупки для отслеживания
            setActivePurchaseId(paymentData.purchaseId);

            // Перенаправляем пользователя на страницу оплаты YooKassa
            window.location.href = paymentData.confirmationUrl;
        } catch (error) {
            console.error('Purchase failed:', error);
            setNotification({
                type: 'error',
                message: error instanceof Error ? error.message : 'Ошибка при создании платежа',
            });
        } finally {
            setPurchaseLoading(null);
        }
    };

    const handlePaymentSuccess = () => {
        setActivePurchaseId(null);
        setNotification({
            type: 'success',
            message: 'Оплата прошла успешно! Токены добавлены на ваш баланс.',
        });

        // Обновляем данные
        refreshBalance();
        refreshTransactions();

        // Убираем purchaseId из URL
        router.replace('/tokens');

        // Убираем уведомление через 5 секунд
        setTimeout(() => setNotification(null), 5000);
    };

    const handlePaymentError = (error: string) => {
        setActivePurchaseId(null);
        setNotification({
            type: 'error',
            message: error,
        });

        // Убираем purchaseId из URL
        router.replace('/tokens');

        // Убираем уведомление через 5 секунд
        setTimeout(() => setNotification(null), 5000);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinnerLarge}></div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>Токены</h1>
                    <p className={styles.subtitle}>Управляйте своими токенами для использования AI-функций</p>
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

                {/* Current Balance */}
                <div className={styles.balanceCard}>
                    <div className={styles.balanceContent}>
                        <div className={styles.balanceLeft}>
                            <h2 className={styles.balanceTitle}>Текущий баланс</h2>
                            <div className={styles.balanceAmount}>
                                <FaCoins className={styles.balanceIcon} />
                                <span className={styles.balanceNumber}>{formatTokenAmount(balance)}</span>
                                <span className={styles.balanceUnit}>токенов</span>
                            </div>
                        </div>
                        <div className={styles.balanceRight}>
                            <p className={styles.usageLabel}>Примерное использование:</p>
                            <p className={styles.usageAmount}>~{Math.floor(balance / 50)} слайдов</p>
                        </div>
                    </div>
                </div>

                {/* Token Packages */}
                <div className={styles.packagesSection}>
                    <h2 className={styles.sectionTitle}>Пакеты токенов</h2>
                    <div className={styles.packagesGrid}>
                        {packages.map(pkg => (
                            <TokenPackageCard
                                key={pkg.id}
                                package={pkg}
                                onPurchase={() => handlePurchase(pkg.id)}
                                isLoading={purchaseLoading === pkg.id}
                            />
                        ))}
                    </div>
                </div>

                {/* Transaction History */}
                <div className={styles.transactionsCard}>
                    <div className={styles.transactionsHeader}>
                        <h2 className={styles.transactionsTitle}>
                            <FaHistory />
                            История транзакций
                        </h2>
                    </div>
                    <div className={styles.transactionsList}>
                        {transactions.length > 0 ? (
                            transactions.map(transaction => (
                                <TransactionRow key={transaction.id} transaction={transaction} />
                            ))
                        ) : (
                            <div className={styles.emptyState}>Нет транзакций</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tokens;

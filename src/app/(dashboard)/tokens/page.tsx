'use client';

import { useState } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { TokenPackage } from '@/types/tokens';
import { FaCreditCard, FaHistory, FaCoins } from 'react-icons/fa';
import { HiOutlineCreditCard } from 'react-icons/hi2';
import styles from './page.module.css';

export default function TokensPage() {
    const { balance, loading, packages, transactions, purchaseTokens } = useTokens();
    const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

    const handlePurchase = async (packageId: string) => {
        setPurchaseLoading(packageId);
        try {
            await purchaseTokens(packageId);
        } catch (error) {
            console.error('Purchase failed:', error);
            alert('Purchase failed. Please try again.');
        } finally {
            setPurchaseLoading(null);
        }
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
}

interface TokenPackageCardProps {
    package: TokenPackage;
    onPurchase: () => void;
    isLoading: boolean;
}

const TokenPackageCard = ({ package: pkg, onPurchase, isLoading }: TokenPackageCardProps) => {
    const tokensPerDollar = pkg.tokens / pkg.price;

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
                    {/* <p className={styles.packageValue}>{tokensPerDollar.toFixed(0)} токенов за 1₽</p> */}
                </div>

                <div className={styles.packagePrice}>{pkg.price}₽</div>

                <button onClick={onPurchase} disabled={isLoading} className={styles.purchaseButton}>
                    {isLoading ? (
                        <div className={styles.loadingSpinner}></div>
                    ) : (
                        <>
                            <FaCreditCard />
                            Купить
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

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

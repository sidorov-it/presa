import React from 'react';
import { TokenPackage } from '@/types/tokens';
import { FaCoins } from 'react-icons/fa';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { Card } from '@/components/ui/Card/Card';
import { CloudPaymentsPaymentButton } from '@/components/tokens/CloudPaymentsPaymentButton';
import styles from './TokenPackageCard.module.css';

interface TokenPackageCardProps {
    package: TokenPackage;
    onPurchase: (purchaseId: string) => void;
    isLoading: boolean;
}

export const TokenPackageCard: React.FC<TokenPackageCardProps> = ({ package: pkg, onPurchase, isLoading }) => {
    return (
        <Card isPopular={pkg.isPopular}>
            <div className={styles.packageContent}>
                <h3 className={styles.packageName}>{pkg.name}</h3>
                {pkg.description && <p className={styles.packageDescription}>{pkg.description}</p>}

                <div className={styles.packageTokens}>
                    <div className={styles.packageTokensAmount}>
                        <FaCoins className={styles.packageTokensIcon} />
                        <span className={styles.packageTokensNumber}>{formatTokenAmount(pkg.tokens)}</span>
                    </div>
                </div>

                <div className={styles.packagePrice}>{pkg.price} руб.</div>

                <CloudPaymentsPaymentButton
                    packageId={pkg.id}
                    onSuccess={purchaseId => onPurchase(purchaseId)}
                    onError={error => console.error('Payment error:', error)}
                    isLoading={isLoading}
                />
            </div>
        </Card>
    );
};

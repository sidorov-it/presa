/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
'use client';

import { LuCoins } from 'react-icons/lu';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import styles from './TokenBalance.module.css';

interface TokenBalanceProps {
    balance: number;
    loading?: boolean;
    showIcon?: boolean;
    className?: string;
    onClick?: () => void;
}

export const TokenBalance = ({ balance, loading = false, showIcon = true, className, onClick }: TokenBalanceProps) => {
    const containerClasses = [styles.container, onClick ? styles.clickable : '', className || '']
        .filter(Boolean)
        .join(' ');

    const iconClasses = [styles.icon, styles.iconCompact].join(' ');

    const textClasses = [styles.text, styles.textCompact].join(' ');

    const Icon = LuCoins;

    return (
        <>
            <div className={containerClasses} onClick={onClick}>
                <div className={styles.balanceContainer}>
                    {showIcon && <Icon className={`${iconClasses}`} />}
                    <span className={`${textClasses}`}>
                        {loading ? '...' : formatTokenAmount(balance)}
                        {' токенов'}
                    </span>
                </div>

                {/* {showBuyButton && (
                    <button
                        onClick={handleBuyTokens}
                        className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Купить токены"
                    >
                        <HiPlus className="w-4 h-4 text-gray-600" />
                    </button>
                )} */}
            </div>
        </>
    );
};

export default TokenBalance;

'use client';

import { HiOutlineCreditCard } from 'react-icons/hi2';
import { FaCoins } from 'react-icons/fa';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import styles from './TokenBalance.module.css';

interface TokenBalanceProps {
    balance: number;
    loading?: boolean;
    variant?: 'compact' | 'full' | 'large';
    showIcon?: boolean;
    className?: string;
    onClick?: () => void;
}

export const TokenBalance = ({
    balance,
    loading = false,
    variant = 'compact',
    showIcon = true,
    className,
    onClick,
}: TokenBalanceProps) => {
    const containerClasses = [styles.container, onClick ? styles.clickable : '', className || '']
        .filter(Boolean)
        .join(' ');

    const iconClasses = [
        styles.icon,
        variant === 'compact' ? styles.iconCompact : '',
        variant === 'full' ? styles.iconFull : '',
        variant === 'large' ? styles.iconLarge : '',
    ]
        .filter(Boolean)
        .join(' ');

    const textClasses = [
        styles.text,
        variant === 'compact' ? styles.textCompact : '',
        variant === 'full' ? styles.textFull : '',
        variant === 'large' ? styles.textLarge : '',
    ]
        .filter(Boolean)
        .join(' ');

    const Icon = variant === 'large' ? FaCoins : HiOutlineCreditCard;

    return (
        <div className={containerClasses} onClick={onClick}>
            {showIcon && <Icon className={iconClasses} />}
            <span className={textClasses}>
                {loading ? '...' : formatTokenAmount(balance)}
                {variant !== 'compact' && ' токенов'}
            </span>
        </div>
    );
};

export default TokenBalance;

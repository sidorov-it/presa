/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
'use client';

import { useState } from 'react';
import { HiOutlineCreditCard, HiPlus } from 'react-icons/hi2';
import { FaCoins } from 'react-icons/fa';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { TokenPurchaseModal } from './TokenPurchaseModal';
import styles from './TokenBalance.module.css';

interface TokenBalanceProps {
    balance: number;
    loading?: boolean;
    variant?: 'compact' | 'full' | 'large';
    showIcon?: boolean;
    showBuyButton?: boolean;
    className?: string;
    onClick?: () => void;
    onBalanceUpdate?: () => void;
}

export const TokenBalance = ({
    balance,
    loading = false,
    variant = 'compact',
    showIcon = true,
    showBuyButton = false,
    className,
    onClick,
    onBalanceUpdate,
}: TokenBalanceProps) => {
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    const handleBuyTokens = (e: React.MouseEvent) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        setIsPurchaseModalOpen(true);
    };

    const handlePurchaseSuccess = () => {
        if (onBalanceUpdate) {
            onBalanceUpdate();
        }
    };

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

    // Определяем, нужно ли показывать предупреждение о низком балансе
    const isLowBalance = balance < 100;

    return (
        <>
            <div className={containerClasses} onClick={onClick}>
                <div className="flex items-center gap-2">
                    {showIcon && <Icon className={`${iconClasses} ${isLowBalance ? 'text-orange-500' : ''}`} />}
                    <span className={`${textClasses} ${isLowBalance ? 'text-orange-600' : ''}`}>
                        {loading ? '...' : formatTokenAmount(balance)}
                        {variant !== 'compact' && ' токенов'}
                    </span>
                </div>

                {showBuyButton && (
                    <button
                        onClick={handleBuyTokens}
                        className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Купить токены"
                    >
                        <HiPlus className="w-4 h-4 text-gray-600" />
                    </button>
                )}
            </div>

            {/* Показываем предупреждение о низком балансе для больших вариантов */}
            {(variant === 'full' || variant === 'large') && isLowBalance && !loading && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                    <div className="flex items-center justify-between">
                        <span>Мало токенов для ИИ операций</span>
                        <button onClick={handleBuyTokens} className="text-orange-700 hover:text-orange-800 underline">
                            Пополнить
                        </button>
                    </div>
                </div>
            )}

            <TokenPurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                onSuccess={handlePurchaseSuccess}
            />
        </>
    );
};

export default TokenBalance;

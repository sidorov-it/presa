import React from 'react';
import { FaCrown } from 'react-icons/fa';
import styles from './Card.module.css';

interface ProductCardProps {
    children: React.ReactNode;
    isPopular?: boolean;
    className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ children, isPopular = false, className = '' }) => {
    return (
        <div className={`${styles.card} ${isPopular ? styles.popular : ''} ${className}`}>
            {isPopular && (
                <div className={styles.popularBadge}>
                    <FaCrown className={styles.crownIcon} />
                    Популярный
                </div>
            )}
            {children}
        </div>
    );
};

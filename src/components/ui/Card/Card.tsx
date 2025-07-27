import React from 'react';
import { FaCrown } from 'react-icons/fa';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    isPopular?: boolean;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, isPopular = false, className = '' }) => {
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

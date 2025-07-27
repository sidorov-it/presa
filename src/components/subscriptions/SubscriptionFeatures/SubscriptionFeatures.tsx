import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { SUBSCRIPTION_FEATURES } from '@/constants/subscriptionFeatures';
import styles from './SubscriptionFeatures.module.css';

interface SubscriptionFeaturesProps {
    title?: string;
    className?: string;
}

export const SubscriptionFeatures: React.FC<SubscriptionFeaturesProps> = ({
    title = 'Что включено:',
    className,
}) => {
    return (
        <div className={`${styles.featuresSection} ${className || ''}`.trim()}>
            {title && <h4 className={styles.featuresTitle}>{title}</h4>}
            <ul className={styles.featuresList}>
                {SUBSCRIPTION_FEATURES.map((feature, index) => (
                    <li key={index} className={styles.featureItem}>
                        <FaCheckCircle className={styles.checkIcon} />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { SUBSCRIPTION_FEATURES } from '@/constants/subscriptionFeatures';
import styles from './SubscriptionFeatures.module.css';

export const SubscriptionFeatures: React.FC = () => (
    <div className={styles.featuresSection}>
        <h4 className={styles.featuresTitle}>Что включено:</h4>
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

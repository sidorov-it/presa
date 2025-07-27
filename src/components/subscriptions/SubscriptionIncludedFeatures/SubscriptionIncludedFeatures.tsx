import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import styles from './SubscriptionIncludedFeatures.module.css';

const features = [
    'До 20 слайдов при генерации презентации',
    'Без водяного знака при экспорте',
    'Увеличенный лимит размера документов для генерации презентации ИИ',
    'Приоритетная обработка AI-запросов',
    'Все возможности экспорта',
];

export const SubscriptionIncludedFeatures: React.FC = () => (
    <div className={styles.featuresSection}>
        <h4 className={styles.featuresTitle}>Что включено:</h4>
        <ul className={styles.featuresList}>
            {features.map(feature => (
                <li key={feature} className={styles.featureItem}>
                    <FaCheckCircle className={styles.checkIcon} />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
    </div>
);

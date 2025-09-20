/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
'use client';

import React, { useCallback, useEffect } from 'react';
import { FaCrown, FaStar } from 'react-icons/fa';
import Portal from '@/components/Portal';
import Link from 'next/link';
import styles from './SubscriptionModal.module.css';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
    // Handle escape key
    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (event.target === event.currentTarget) {
                onClose();
            }
        },
        [onClose]
    );

    const handleOverlayKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClose();
            }
        },
        [onClose]
    );

    const handleModalClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        // Предотвращаем всплытие события, чтобы клики внутри модального окна не закрывали его
        event.stopPropagation();
    }, []);

    const handleLinkClick = useCallback(() => {
        onClose();
    }, [onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <Portal>
            <div
                className={styles.overlay}
                role="button"
                tabIndex={0}
                aria-label="Закрыть модальное окно"
                onClick={handleOverlayClick}
                onKeyDown={handleOverlayKeyDown}
                data-subscription-modal="overlay"
            >
                <div
                    className={styles.modal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="subscription-modal-title"
                    tabIndex={-1}
                    onClick={handleModalClick}
                    data-subscription-modal="content"
                >
                    <FaCrown className={styles.icon} aria-hidden="true" />
                    <h3 id="subscription-modal-title" className={styles.title}>
                        Премиум функции доступны по подписке
                    </h3>
                    <div className={styles.description}>
                        <p>Получите доступ к расширенным возможностям для создания профессиональных презентаций:</p>
                        <ul className={styles.featuresList}>
                            <li className={styles.featureItem}>
                                <span>
                                    <FaStar className={styles.featureIcon} size={24} aria-hidden="true" />
                                </span>
                                <span>Колонтитулы с логотипами и номерами слайдов</span>
                            </li>
                            <li className={styles.featureItem}>
                                <span>
                                    <FaStar className={styles.featureIcon} size={24} aria-hidden="true" />
                                </span>
                                <span>Без водяного знака при экспорте</span>
                            </li>
                            <li className={styles.featureItem}>
                                <span>
                                    <FaStar className={styles.featureIcon} size={24} aria-hidden="true" />
                                </span>
                                <span>Увеличенный лимит размера документов для генерации презентации ИИ</span>
                            </li>
                            <li className={styles.featureItem}>
                                <span>
                                    <FaStar className={styles.featureIcon} size={24} aria-hidden="true" />
                                </span>
                                <span>Генерация до 20 слайдов вместо 10 при создании презентации</span>
                            </li>
                            <li className={styles.featureItem}>
                                <span>
                                    <FaStar className={styles.featureIcon} size={24} aria-hidden="true" />
                                </span>
                                <span>Приоритетная обработка AI-запросов</span>
                            </li>
                        </ul>
                    </div>
                    <div className={styles.actions}>
                        <Link href="/payment" className={styles.link} onClick={handleLinkClick}>
                            Обновить подписку
                        </Link>
                        <button type="button" className={styles.closeButton} onClick={onClose}>
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default SubscriptionModal;

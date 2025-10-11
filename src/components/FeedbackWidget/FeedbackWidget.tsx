'use client';

import { useState } from 'react';
import { Portal } from '@chakra-ui/react';
import { FiMessageCircle, FiThumbsUp, FiThumbsDown, FiX } from 'react-icons/fi';
import { toaster } from '@/components/ui/toaster';
import styles from './FeedbackWidget.module.css';

type FeedbackRating = 'positive' | 'negative';

// Helper function to detect browser from user agent
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    // Detect browser
    if (ua.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        const match = ua.match(/Firefox\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (ua.indexOf('Edg') > -1) {
        browserName = 'Edge';
        const match = ua.match(/Edg\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (ua.indexOf('Chrome') > -1) {
        browserName = 'Chrome';
        const match = ua.match(/Chrome\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (ua.indexOf('Safari') > -1) {
        browserName = 'Safari';
        const match = ua.match(/Version\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
        browserName = 'Opera';
        const match = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    }

    return {
        name: browserName,
        version: browserVersion,
        userAgent: ua,
    };
}

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState<FeedbackRating | null>(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!rating) {
            toaster.create({
                title: 'Пожалуйста, выберите оценку',
                type: 'warning',
                duration: 3000,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating,
                    comment: comment.trim() || undefined,
                    page: window.location.href,
                    metadata: {
                        screenWidth: window.innerWidth,
                        screenHeight: window.innerHeight,
                        language: navigator.language,
                        platform: navigator.platform,
                        browser: getBrowserInfo(),
                    },
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSubmitted(true);
                toaster.create({
                    title: data.message || 'Спасибо за ваш отзыв!',
                    type: 'success',
                    duration: 3000,
                });

                // Reset form after a short delay
                setTimeout(() => {
                    handleClose();
                }, 2000);
            } else {
                throw new Error(data.error || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toaster.create({
                title: 'Не удалось отправить отзыв',
                description: 'Пожалуйста, попробуйте позже',
                type: 'error',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(null);
        setComment('');
        setIsSubmitted(false);
        setIsOpen(false);
    };

    const handleRatingClick = (selectedRating: FeedbackRating) => {
        setRating(selectedRating);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        }
    };

    return (
        <>
            {/* Floating button */}
            <button className={styles.floatingButton} onClick={() => setIsOpen(true)} aria-label="Оставить отзыв">
                <FiMessageCircle size={24} />
            </button>

            {/* Feedback modal */}
            {isOpen && (
                <Portal>
                    <div
                        className={styles.overlay}
                        onClick={handleOverlayClick}
                        role="button"
                        tabIndex={-1}
                        onKeyDown={handleKeyDown}
                        aria-label="Закрыть модальное окно"
                    >
                        <div className={styles.modal} role="dialog" aria-modal="true" tabIndex={-1}>
                            <div className={styles.header}>
                                <h2 className={styles.title}>Обратная связь</h2>
                                <button className={styles.closeButton} onClick={handleClose} aria-label="Закрыть">
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className={styles.body}>
                                {!isSubmitted ? (
                                    <div className={styles.form}>
                                        <div className={styles.ratingSection}>
                                            <p className={styles.label}>Как вам наш сервис?</p>
                                            <div className={styles.ratingButtons}>
                                                <button
                                                    className={`${styles.ratingButton} ${styles.positive} ${rating === 'positive' ? styles.active : ''}`}
                                                    onClick={() => handleRatingClick('positive')}
                                                >
                                                    <FiThumbsUp size={20} />
                                                    <span>Нравится</span>
                                                </button>
                                                <button
                                                    className={`${styles.ratingButton} ${styles.negative} ${rating === 'negative' ? styles.active : ''}`}
                                                    onClick={() => handleRatingClick('negative')}
                                                >
                                                    <FiThumbsDown size={20} />
                                                    <span>Не нравится</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.commentSection}>
                                            <label htmlFor="feedback-comment" className={styles.label}>
                                                Комментарий (необязательно)
                                            </label>
                                            <textarea
                                                id="feedback-comment"
                                                className={styles.textarea}
                                                placeholder="Расскажите, что можно улучшить или что вам особенно понравилось..."
                                                value={comment}
                                                onChange={e => setComment(e.target.value)}
                                                rows={4}
                                            />
                                        </div>

                                        <button
                                            className={styles.submitButton}
                                            onClick={handleSubmit}
                                            disabled={!rating || isSubmitting}
                                        >
                                            {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.successMessage}>
                                        <div className={styles.successIcon}>✓</div>
                                        <h3 className={styles.successTitle}>Спасибо за ваш отзыв!</h3>
                                        <p className={styles.successText}>Ваше мнение помогает нам стать лучше</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </>
    );
}

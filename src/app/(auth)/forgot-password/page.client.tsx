'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { logCaughtError } from '@/utils/errorReporting';
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Пожалуйста, укажите вашу электронную почту');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Не удалось отправить ссылку для сброса');
                setIsLoading(false);
                return;
            }

            // Success, show success message
            setIsSubmitted(true);
            setIsLoading(false);
        } catch (error) {
            logCaughtError(error, {
                action: 'Запрос восстановления пароля',
                component: 'ForgotPasswordPage',
                additionalInfo: { email },
            });
            console.error('Forgot password error:', error);
            setError('Что-то пошло не так. Попробуйте еще раз.');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div>
                    <h1 className={styles.title}>Восстановить пароль</h1>
                    <p className={styles.description}>Мы отправим вам ссылку для сброса пароля</p>
                </div>

                {isSubmitted ? (
                    <div className={styles.successContainer}>
                        <div
                            style={{
                                display: 'flex',
                            }}
                        >
                            <div
                                style={{
                                    flexShrink: 0,
                                }}
                            >
                                <svg
                                    style={{
                                        height: '1.25rem',
                                        width: '1.25rem',
                                        color: '#34D399',
                                    }}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div
                                style={{
                                    marginLeft: '0.75rem',
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: '0.875rem',
                                        lineHeight: '1.25rem',
                                        fontWeight: '500',
                                        color: '#065F46',
                                    }}
                                >
                                    Ссылка для сброса отправлена
                                </h3>
                                <div
                                    style={{
                                        marginTop: '0.5rem',
                                        fontSize: '0.875rem',
                                        lineHeight: '1.25rem',
                                        color: '#047857',
                                    }}
                                >
                                    <p>
                                        Мы отправили ссылку для сброса пароля на {email}. Пожалуйста, проверьте ваш
                                        почтовый ящик.
                                    </p>
                                </div>
                                <div
                                    style={{
                                        marginTop: '1rem',
                                    }}
                                >
                                    <Link
                                        href="/login"
                                        style={{
                                            fontSize: '0.875rem',
                                            lineHeight: '1.25rem',
                                            fontWeight: '500',
                                            color: '#3B82F6',
                                            marginTop: '1rem',
                                            marginBottom: '1rem',
                                        }}
                                    >
                                        Вернуться на страницу входа
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form
                        style={{
                            marginTop: '1.5rem',
                        }}
                        onSubmit={handleSubmit}
                    >
                        <div>
                            <label htmlFor="email-address" className={styles.label}>
                                Электронная почта
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={styles.input}
                                placeholder="Электронная почта"
                            />
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '1rem',
                                marginBottom: '1rem',
                            }}
                        >
                            <div style={{ fontSize: '0.875rem', lineHeight: '1.25rem' }}>
                                <Link href="/login" className={styles.link}>
                                    Вернуться на страницу входа
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button type="submit" className={styles.button} disabled={isLoading}>
                                {isLoading ? 'Отправляем ссылку...' : 'Отправить ссылку'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

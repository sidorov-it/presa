'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { logCaughtError } from '@/utils/errorReporting';

const ResetPassword = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isInvalidToken, setIsInvalidToken] = useState(false);

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
            // Verify token is valid
            verifyToken(tokenParam);
        } else {
            setIsInvalidToken(true);
        }
    }, [searchParams]);

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch('/api/auth/verify-reset-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                setIsInvalidToken(true);
            }
        } catch (error) {
            logCaughtError(error, {
                action: 'Проверка токена восстановления пароля',
                component: 'ResetPassword',
                additionalInfo: { hasToken: !!token },
            });
            console.error('Token verification error:', error);
            setIsInvalidToken(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            setError('Пожалуйста, заполните все поля');
            return;
        }

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (password.length < 8) {
            setError('Пароль должен содержать не менее 8 символов');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Не удалось сбросить пароль');
                setIsLoading(false);
                return;
            }

            // Success
            setIsSuccess(true);
            setIsLoading(false);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (error) {
            logCaughtError(error, {
                action: 'Сброс пароля',
                component: 'ResetPassword',
                additionalInfo: { hasToken: !!token },
            });
            console.error('Password reset error:', error);
            setError('Что-то пошло не так. Попробуйте еще раз.');
            setIsLoading(false);
        }
    };

    if (isInvalidToken) {
        return (
            <div className={styles.container}>
                <div className={styles.formWrapper}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Недействительный или просроченный токен</h1>
                        <p className={styles.subtitle}>Ссылка для сброса пароля недействительна или устарела.</p>
                    </div>
                    <div className={styles.header}>
                        <Link href="/forgot-password" className={styles.link}>
                            Запросить новую ссылку для сброса пароля
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Создайте новый пароль</h1>
                    <p className={styles.subtitle}>Введите новый пароль ниже</p>
                </div>

                {isSuccess ? (
                    <div className={styles.successAlert}>
                        <div style={{ display: 'flex' }}>
                            <div style={{ flexShrink: 0 }}>
                                <svg
                                    className={styles.successIcon}
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
                            <div className={styles.successContent}>
                                <h3 className={styles.successTitle}>Пароль успешно сброшен</h3>
                                <div className={styles.successMessage}>
                                    <p>
                                        Пароль успешно изменён. Через несколько секунд вы будете перенаправлены на
                                        страницу входа.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form className={styles.formContent} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Новый пароль
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className={`${styles.input} ${styles.inputFirst}`}
                                    placeholder="Новый пароль"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="sr-only">
                                    Подтвердите новый пароль
                                </label>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={`${styles.input} ${styles.inputLast}`}
                                    placeholder="Подтвердите новый пароль"
                                />
                            </div>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <div>
                            <button type="submit" className={styles.submitButton} disabled={isLoading}>
                                {isLoading ? 'Сбрасываем пароль...' : 'Сбросить пароль'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;

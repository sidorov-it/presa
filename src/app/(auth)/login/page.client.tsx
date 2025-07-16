'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const emailVerified = searchParams.get('email-verified');
        const registered = searchParams.get('registered');
        
        if (emailVerified === 'true') {
            setSuccessMessage('Email успешно подтвержден!');
        } else if (registered === 'true') {
            setSuccessMessage('Проверьте вашу почту для подтверждения email.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Пожалуйста, заполните все поля');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError('Неверный email или пароль');
                setIsLoading(false);
                return;
            }

            // Success, redirect to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setError('Что-то пошло не так. Попробуйте еще раз.');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginContainer}>
                <div>
                    <h1 className={styles.loginTitle}>Войти</h1>
                    <p className={styles.loginDescription}>
                        или{' '}
                        <Link href="/register" className={styles.loginLink}>
                            создать новый аккаунт
                        </Link>
                    </p>
                </div>

                <form className={styles.loginForm} onSubmit={handleSubmit}>
                    <div className={styles.loginFormInput}>
                        <div>
                            <label htmlFor="email-address" className="sr-only">
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
                                className={`${styles.loginFormInputField} ${styles.loginFormInputFieldTop}`}
                                placeholder="Электронная почта"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Пароль
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={`${styles.loginFormInputField} ${styles.loginFormInputFieldBottom}`}
                                placeholder="Пароль"
                            />
                        </div>
                    </div>

                    {error && <div className={styles.loginFormError}>{error}</div>}
                    {successMessage && <div className={styles.loginFormSuccess}>{successMessage}</div>}

                    <div className={styles.loginFormRemember}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className={styles.loginFormRememberCheckbox}
                            />
                            <label htmlFor="remember-me" className={styles.loginFormRememberLabel}>
                                Запомнить меня
                            </label>
                        </div>

                        <div style={{ fontSize: '0.875rem', lineHeight: '1.25rem' }}>
                            <Link href="/forgot-password" className={styles.loginFormRememberLink}>
                                Забыли пароль?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button type="submit" className={styles.loginFormButton} disabled={isLoading}>
                            {isLoading ? 'Входим...' : 'Войти'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

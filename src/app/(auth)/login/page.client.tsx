'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (status === 'authenticated' && session && session.user.emailVerified) {
            console.log('[LOGIN_PAGE] User is already authenticated, redirecting to dashboard');
            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
            router.replace(callbackUrl);
            return;
        }
    }, [status, session, router, searchParams]);

    useEffect(() => {
        // Only process URL params if user is not authenticated
        if (status === 'authenticated') return;

        const emailVerified = searchParams.get('email-verified');
        const registered = searchParams.get('registered');
        const authError = searchParams.get('error');

        console.log('[LOGIN_PAGE] URL params:', { emailVerified, registered, authError });

        if (emailVerified === 'true') {
            setSuccessMessage('Email успешно подтвержден!');
        } else if (registered === 'true') {
            setSuccessMessage('Проверьте вашу почту для подтверждения email.');
        } else if (authError) {
            // Handle OAuth errors
            if (authError === 'OAuthCallback') {
                setError('Ошибка авторизации через внешний сервис. Попробуйте еще раз.');
            } else if (authError === 'EmailRegistered') {
                setError('На ваш email уже зарегистрирован аккаунт. Пожалуйста, войдите через почту и пароль');
            } else if (authError === 'CodeExpired') {
                setError('Код авторизации истек. Попробуйте войти снова и завершите авторизацию быстрее.');
            } else if (authError === 'TooManyRetries') {
                setError('Слишком много попыток авторизации. Подождите несколько минут.');
            } else if (authError === 'Configuration') {
                setError('Ошибка конфигурации OAuth. Обратитесь в поддержку.');
            } else {
                setError('Произошла ошибка авторизации. Попробуйте еще раз.');
            }
        }
    }, [searchParams, status]);

    // Show loading state while checking authentication
    // if (status === 'loading') {
    //     return (
    //         <div className={styles.loginPage}>
    //             <div className={styles.loginContainer}>
    //                 <div style={{ textAlign: 'center' }}>
    //                     <h1 className={styles.loginTitle}>Загрузка...</h1>
    //                     <p className={styles.loginDescription}>Проверка авторизации</p>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    // // Don't render login form if user is authenticated
    // if (status === 'authenticated') {
    //     return (
    //         <div className={styles.loginPage}>
    //             <div className={styles.loginContainer}>
    //                 <div style={{ textAlign: 'center' }}>
    //                     <h1 className={styles.loginTitle}>Перенаправление...</h1>
    //                     <p className={styles.loginDescription}>Вы уже авторизованы</p>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    const providerNames: Record<string, string> = {
        vk: 'VK',
        mailru: 'Mail.ru',
        yandex: 'Yandex',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Пожалуйста, заполните все поля');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            console.log('[LOGIN_PAGE] Attempting credentials login for:', email);

            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
                callbackUrl,
            });

            console.log('[LOGIN_PAGE] Credentials login result:', result);

            if (result?.error) {
                if (result.error.startsWith('OAUTH_ONLY:')) {
                    const provider = result.error.split(':')[1];
                    const name = providerNames[provider] ?? provider;
                    setError(`Вы регистрировались через ${name}, вход по паролю невозможен`);
                } else {
                    setError('Неверный email или пароль');
                }
                setIsLoading(false);
                return;
            }

            // Success, redirect to dashboard or callback URL
            console.log('[LOGIN_PAGE] Login successful, redirecting to:', callbackUrl);
            router.push(callbackUrl);
        } catch (error) {
            console.error('[LOGIN_PAGE] Login error:', error);
            setError('Что-то пошло не так. Попробуйте еще раз.');
            setIsLoading(false);
        }
    };

    const handleOAuth = async (provider: string) => {
        try {
            setIsLoading(true);
            setError('');

            console.log(`[LOGIN_PAGE] Attempting OAuth login with ${provider}`);

            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
            const result = await signIn(provider, {
                redirect: false,
                callbackUrl,
            });

            console.log(`[LOGIN_PAGE] OAuth ${provider} result:`, result);

            if (result?.error) {
                console.error(`[LOGIN_PAGE] OAuth ${provider} error:`, result.error);
                if (result.error === 'EmailRegistered') {
                    setError('На ваш email уже зарегистрирован аккаунт. Пожалуйста, войдите через почту и пароль');
                } else {
                    const name = providerNames[provider] ?? provider;
                    setError(`Не удалось войти через ${name}: ${result.error}`);
                }
                setIsLoading(false);
                return;
            }

            if (result?.url) {
                console.log(`[LOGIN_PAGE] OAuth ${provider} redirecting to:`, result.url);
                window.location.href = result.url;
            } else {
                console.log(`[LOGIN_PAGE] OAuth ${provider} success, redirecting to:`, callbackUrl);
                router.push(callbackUrl);
            }
        } catch (err) {
            console.error(`[LOGIN_PAGE] OAuth ${provider} error:`, err);
            setError('Не удалось выполнить вход');
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
                    <div className={styles.socialButtons}>
                        <div className={styles.socialButtonsSeparator}>
                            <div className={styles.socialButtonsSeparatorText}>или</div>
                        </div>

                        {isLoading && (
                            <button
                                type="button"
                                onClick={() => handleOAuth('yandex')}
                                className={styles.socialButton}
                                disabled={isLoading}
                            >
                                Входим...
                            </button>
                        )}
                        {!isLoading && (
                            <button
                                type="button"
                                onClick={() => handleOAuth('yandex')}
                                className={styles.yandexLoginButton}
                                disabled={isLoading}
                            >
                                <span className={styles.yandexLogo} />
                                <span className={styles.yandexLoginButtonText}>Войти с Яндекс ID</span>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

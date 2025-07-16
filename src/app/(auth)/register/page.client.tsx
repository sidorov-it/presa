'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
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

        if (!agreeToTerms) {
            setError('Необходимо согласиться с правилами и дать согласие на обработку персональных данных');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Не удалось зарегистрироваться');
                setIsLoading(false);
                return;
            }

            // Success, redirect to login
            router.push('/login?registered=true');
        } catch (error) {
            console.error('Registration error:', error);
            setError('Что-то пошло не так. Попробуйте еще раз.');
            setIsLoading(false);
        }
    };

    const isFormValid = name && email && password && confirmPassword && password === confirmPassword && password.length >= 8 && agreeToTerms;

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Создать аккаунт</h1>
                    <p className={styles.subtitle}>
                        или{' '}
                        <Link href="/login" className={styles.link}>
                            войти в ваш существующий аккаунт
                        </Link>
                    </p>
                </div>

                <form className={styles.formContent} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <div>
                            <label htmlFor="name" className="sr-only">
                                Имя
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className={`${styles.input} ${styles.inputFirst}`}
                                placeholder="Имя"
                            />
                        </div>
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
                                className={styles.input}
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
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={styles.input}
                                placeholder="Пароль"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="sr-only">
                                Подтвердить пароль
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
                                placeholder="Подтвердить пароль"
                            />
                        </div>
                    </div>

                    <div className={styles.checkboxGroup}>
                        <input
                            id="agree-terms"
                            name="agree-terms"
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={e => setAgreeToTerms(e.target.checked)}
                            className={styles.checkbox}
                            required
                        />
                        <label htmlFor="agree-terms" className={styles.checkboxLabel}>
                            Создавая аккаунт, я соглашаюсь с{' '}
                            <Link href="/terms" className={styles.checkboxLink} target="_blank">
                                пользовательским соглашением
                            </Link>
                            {' '}и даю согласие на{' '}
                            <Link href="/privacy" className={styles.checkboxLink} target="_blank">
                                обработку персональных данных
                            </Link>
                            .
                        </label>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div>
                        <button 
                            type="submit" 
                            className={styles.submitButton} 
                            disabled={isLoading || !isFormValid}
                        >
                            {isLoading ? 'Создаем аккаунт...' : 'Создать аккаунт'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

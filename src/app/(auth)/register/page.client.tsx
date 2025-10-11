'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { logCaughtError } from '@/utils/errorReporting';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('Пароль должен содержать не менее 8 символов');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleNameChange = (value: string) => {
        setName(value);
        setNameError(value.trim() ? '' : 'Имя обязательно');
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        setEmailError(emailRegex.test(value) ? '' : 'Введите корректный email');
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setPasswordError(value.length >= 8 ? '' : 'Пароль должен содержать не менее 8 символов');
        if (confirmPassword) {
            setConfirmPasswordError(value === confirmPassword ? '' : 'Пароли не совпадают');
        }
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        setConfirmPasswordError(value === password ? '' : 'Пароли не совпадают');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreeToTerms) {
            setError('Необходимо согласиться с правилами и дать согласие на обработку персональных данных');
            return;
        }

        if (!isFormValid) {
            setError('Пожалуйста, исправьте ошибки в форме');
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
            logCaughtError(error, {
                action: 'Регистрация пользователя',
                component: 'RegisterPage',
                additionalInfo: { email, name },
            });
            console.error('Registration error:', error);
            setError('Что-то пошло не так. Попробуйте еще раз.');
            setIsLoading(false);
        }
    };

    const isFormValid =
        !nameError &&
        !emailError &&
        !passwordError &&
        !confirmPasswordError &&
        name !== '' &&
        email !== '' &&
        password !== '' &&
        confirmPassword !== '' &&
        agreeToTerms;

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
                                onChange={e => handleNameChange(e.target.value)}
                                className={`${styles.input} ${styles.inputFirst} ${nameError ? styles.inputError : ''}`}
                                placeholder="Имя"
                            />
                            {nameError && <p className={styles.fieldError}>{nameError}</p>}
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
                                onChange={e => handleEmailChange(e.target.value)}
                                className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                                placeholder="Электронная почта"
                            />
                            {emailError && <p className={styles.fieldError}>{emailError}</p>}
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
                                onChange={e => handlePasswordChange(e.target.value)}
                                className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
                                placeholder="Пароль"
                            />
                            {passwordError && <p className={styles.fieldError}>{passwordError}</p>}
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
                                onChange={e => handleConfirmPasswordChange(e.target.value)}
                                className={`${styles.input} ${styles.inputLast} ${confirmPasswordError ? styles.inputError : ''}`}
                                placeholder="Подтвердить пароль"
                            />
                            {confirmPasswordError && <p className={styles.fieldError}>{confirmPasswordError}</p>}
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
                            <Link href="https://slydle.ru/terms.html" className={styles.checkboxLink} target="_blank">
                                пользовательским соглашением
                            </Link>{' '}
                            и даю согласие на{' '}
                            <Link href="https://slydle.ru/privacy.html" className={styles.checkboxLink} target="_blank">
                                обработку персональных данных
                            </Link>
                            .
                        </label>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div>
                        <button type="submit" className={styles.submitButton} disabled={isLoading || !isFormValid}>
                            {isLoading ? 'Создаем аккаунт...' : 'Создать аккаунт'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

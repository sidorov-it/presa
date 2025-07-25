'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/page.module.css';

const errorMessages: Record<string, string> = {
    Configuration: 'Ошибка конфигурации OAuth',
    AccessDenied: 'Доступ запрещен',
    Verification: 'Ошибка верификации',
    Default: 'Произошла ошибка авторизации',
    OAuthCallback: 'Ошибка OAuth callback',
    EmailRegistered: 'Email уже зарегистрирован с другим провайдером',
    CodeExpired:
        'Код авторизации истек. Это может произойти из-за медленного интернет-соединения или если вы долго не завершали авторизацию.',
    TooManyRetries: 'Слишком много попыток авторизации. Попробуйте позже.',
    invalid_grant: 'Код авторизации истек или недействителен',
    'Code has expired': 'Код авторизации истек. Попробуйте войти снова.',
};

const errorSolutions: Record<string, string> = {
    CodeExpired:
        'Попробуйте войти снова и завершите авторизацию быстрее. Убедитесь, что у вас стабильное интернет-соединение.',
    TooManyRetries: 'Подождите несколько минут перед следующей попыткой входа.',
    EmailRegistered: 'Войдите через email и пароль или используйте восстановление пароля.',
    OAuthCallback: 'Проверьте настройки приватности браузера и попробуйте отключить блокировщики рекламы.',
};

export default function ErrorPageClient() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('[AUTH_ERROR_PAGE] Error:', error);
    console.log('[AUTH_ERROR_PAGE] Error description:', errorDescription);

    const getErrorMessage = () => {
        if (error && errorMessages[error]) {
            return errorMessages[error];
        }

        if (errorDescription) {
            // Check if description contains known error patterns
            if (errorDescription.includes('Code has expired')) {
                return errorMessages['Code has expired'];
            }
            if (errorDescription.includes('invalid_grant')) {
                return errorMessages['invalid_grant'];
            }
            return errorDescription;
        }

        return errorMessages.Default;
    };

    const getSolution = () => {
        if (error && errorSolutions[error]) {
            return errorSolutions[error];
        }
        return null;
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginContainer}>
                <div>
                    <h1 className={styles.loginTitle}>Ошибка авторизации</h1>
                    <div className={styles.loginFormError} style={{ marginBottom: '1rem' }}>
                        {getErrorMessage()}
                    </div>

                    {getSolution() && (
                        <div
                            style={{
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                color: '#374151',
                            }}
                        >
                            <strong>Рекомендация:</strong> {getSolution()}
                        </div>
                    )}

                    <p className={styles.loginDescription}>
                        Попробуйте{' '}
                        <Link href="/login" className={styles.loginLink}>
                            войти снова
                        </Link>{' '}
                        или{' '}
                        <Link href="/register" className={styles.loginLink}>
                            создать новый аккаунт
                        </Link>
                    </p>

                    {error && (
                        <details style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                            <summary>Техническая информация</summary>
                            <div style={{ marginTop: '0.5rem' }}>
                                <p>
                                    <strong>Ошибка:</strong> {error}
                                </p>
                                {errorDescription && (
                                    <p>
                                        <strong>Описание:</strong> {errorDescription}
                                    </p>
                                )}
                            </div>
                        </details>
                    )}
                </div>
            </div>
        </div>
    );
}

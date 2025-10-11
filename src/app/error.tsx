'use client';

import { useEffect } from 'react';
import { logCaughtError } from '@/utils/errorReporting';
import styles from './error.module.css';

/**
 * Error boundary for Next.js app routes
 * Catches errors in page components
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log error to our backend
        logCaughtError(error, {
            action: 'Page error',
            component: 'error.tsx',
            additionalInfo: {
                digest: error.digest, // Next.js error digest
                errorBoundary: 'page',
            },
        });
    }, [error]);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>Что-то пошло не так</h1>
                <p className={styles.message}>
                    Произошла ошибка при загрузке страницы. Попробуйте обновить страницу или вернуться на главную.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <details className={styles.details}>
                        <summary className={styles.summary}>Детали ошибки (только в разработке)</summary>
                        <div className={styles.errorInfo}>
                            <p className={styles.errorMessage}>
                                <strong>Сообщение:</strong> {error.message}
                            </p>
                            {error.digest && (
                                <p className={styles.errorDigest}>
                                    <strong>Digest:</strong> {error.digest}
                                </p>
                            )}
                            <pre className={styles.errorStack}>{error.stack}</pre>
                        </div>
                    </details>
                )}

                <div className={styles.actions}>
                    <button onClick={reset} className={styles.primaryButton}>
                        Попробовать снова
                    </button>
                    <button onClick={() => (window.location.href = '/')} className={styles.secondaryButton}>
                        На главную
                    </button>
                </div>
            </div>
        </div>
    );
}

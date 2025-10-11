'use client';

import { useEffect } from 'react';
import { logCaughtError } from '@/utils/errorReporting';

/**
 * Global error boundary for Next.js app
 * Catches errors in the root layout
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log error to our backend
        logCaughtError(error, {
            action: 'Global application error',
            component: 'global-error',
            additionalInfo: {
                digest: error.digest, // Next.js error digest
                errorBoundary: 'global',
            },
        });
    }, [error]);

    return (
        <html lang="ru">
            <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '600px',
                            width: '100%',
                            backgroundColor: 'white',
                            padding: '40px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            textAlign: 'center',
                        }}
                    >
                        <h1
                            style={{
                                fontSize: '32px',
                                fontWeight: '600',
                                color: '#ef4444',
                                margin: '0 0 16px 0',
                            }}
                        >
                            Критическая ошибка
                        </h1>
                        <p
                            style={{
                                fontSize: '16px',
                                color: '#6b7280',
                                margin: '0 0 24px 0',
                                lineHeight: '1.5',
                            }}
                        >
                            Произошла критическая ошибка приложения. Информация об ошибке отправлена разработчикам.
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <details
                                style={{
                                    textAlign: 'left',
                                    marginBottom: '24px',
                                    padding: '16px',
                                    backgroundColor: '#f3f4f6',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                }}
                            >
                                <summary style={{ cursor: 'pointer', fontWeight: '500' }}>
                                    Детали ошибки (только в разработке)
                                </summary>
                                <pre
                                    style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        backgroundColor: '#1f2937',
                                        color: '#f3f4f6',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        overflow: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordWrap: 'break-word',
                                    }}
                                >
                                    {error.message}
                                    {'\n\n'}
                                    {error.stack}
                                </pre>
                            </details>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#3182ce',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={e => {
                                    (e.target as HTMLElement).style.backgroundColor = '#2c5aa0';
                                }}
                                onMouseOut={e => {
                                    (e.target as HTMLElement).style.backgroundColor = '#3182ce';
                                }}
                                onFocus={e => {
                                    (e.target as HTMLElement).style.backgroundColor = '#2c5aa0';
                                }}
                                onBlur={e => {
                                    (e.target as HTMLElement).style.backgroundColor = '#3182ce';
                                }}
                            >
                                Попробовать снова
                            </button>
                            <button
                                onClick={() => (window.location.href = '/')}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={e => {
                                    (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
                                }}
                                onMouseOut={e => {
                                    (e.target as HTMLElement).style.backgroundColor = 'white';
                                }}
                                onFocus={e => {
                                    (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
                                }}
                                onBlur={e => {
                                    (e.target as HTMLElement).style.backgroundColor = 'white';
                                }}
                            >
                                На главную
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}

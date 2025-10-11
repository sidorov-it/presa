'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '@/utils/errorReporting';
import styles from './ErrorBoundary.module.css';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Report error to backend
        reportError({
            type: 'react',
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            additionalInfo: {
                errorName: error.name,
            },
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className={styles.errorContainer}>
                    <div className={styles.errorContent}>
                        <h2 className={styles.errorTitle}>Что-то пошло не так</h2>
                        <p className={styles.errorMessage}>Произошла ошибка при отображении этой части страницы.</p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className={styles.errorDetails}>
                                <summary>Детали ошибки (только в разработке)</summary>
                                <pre className={styles.errorStack}>
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <button className={styles.resetButton} onClick={this.handleReset}>
                            Попробовать снова
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

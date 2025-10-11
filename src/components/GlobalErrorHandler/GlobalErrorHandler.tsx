'use client';

import { useEffect } from 'react';
import { reportError } from '@/utils/errorReporting';

export default function GlobalErrorHandler() {
    useEffect(() => {
        // Handler for JavaScript errors
        const handleError = (event: ErrorEvent) => {
            const { message, filename, lineno, colno, error } = event;

            reportError({
                type: 'javascript',
                message: message || 'Unknown error',
                stack: error?.stack,
                additionalInfo: {
                    filename,
                    line: lineno,
                    column: colno,
                },
            });
        };

        // Handler for unhandled promise rejections
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason;

            let message = 'Unhandled Promise Rejection';
            let stack: string | undefined;

            if (error instanceof Error) {
                message = error.message;
                stack = error.stack;
            } else if (typeof error === 'string') {
                message = error;
            } else if (error && typeof error === 'object') {
                message = JSON.stringify(error);
            }

            reportError({
                type: 'promise',
                message,
                stack,
                additionalInfo: {
                    promiseRejectionReason: error,
                },
            });
        };

        // Monkey-patch fetch to capture network errors
        const originalFetch = window.fetch;
        window.fetch = async (...args: Parameters<typeof fetch>) => {
            // Extract URL from fetch arguments
            const getUrl = (): string => {
                const input = args[0];
                if (typeof input === 'string') return input;
                if (input instanceof URL) return input.toString();
                if (input instanceof Request) return input.url;
                return 'unknown';
            };

            try {
                const response = await originalFetch(...args);

                // Report HTTP errors (4xx, 5xx)
                if (!response.ok) {
                    reportError({
                        type: 'network',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        additionalInfo: {
                            url: getUrl(),
                            status: response.status,
                            statusText: response.statusText,
                            method: args[1]?.method || 'GET',
                        },
                    });
                }

                return response;
            } catch (error) {
                // Report network failures
                reportError({
                    type: 'network',
                    message: error instanceof Error ? error.message : 'Network request failed',
                    stack: error instanceof Error ? error.stack : undefined,
                    additionalInfo: {
                        url: getUrl(),
                        method: args[1]?.method || 'GET',
                        networkError: true,
                    },
                });

                throw error; // Re-throw to maintain normal error handling
            }
        };

        // Add event listeners
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // Cleanup
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            // Restore original fetch
            window.fetch = originalFetch;
        };
    }, []);

    // This component doesn't render anything
    return null;
}

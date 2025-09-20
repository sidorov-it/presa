'use client';

import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../login/page.module.css';

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    meta?: any;
}

export default function DebugPageClient() {
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [filter, setFilter] = useState('');

    const allParams = Array.from(searchParams.entries()).reduce(
        (acc, [key, value]) => {
            acc[key] = value;
            return acc;
        },
        {} as Record<string, string>
    );

    const fetchLogs = async () => {
        try {
            const url = new URL('/api/debug/logs', window.location.origin);
            if (filter) {
                url.searchParams.set('filter', filter);
            }

            const response = await fetch(url.toString());
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(fetchLogs, 2000); // Refresh every 2 seconds
        return () => clearInterval(interval);
    }, [autoRefresh, filter]);

    const getLogColor = (level: string) => {
        switch (level) {
            case 'error':
                return '#dc2626';
            case 'warn':
                return '#d97706';
            case 'info':
                return '#2563eb';
            default:
                return '#374151';
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginContainer} style={{ maxWidth: '1200px' }}>
                <div>
                    <h1 className={styles.loginTitle}>OAuth Debug Information</h1>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Session Status
                        </h2>
                        <div
                            style={{
                                padding: '0.75rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                            }}
                        >
                            <p>
                                <strong>Status:</strong> {status}
                            </p>
                            {session && (
                                <>
                                    <p>
                                        <strong>User ID:</strong> {session.user?.id}
                                    </p>
                                    <p>
                                        <strong>Email:</strong> {session.user?.email}
                                    </p>
                                    <p>
                                        <strong>Name:</strong> {session.user?.name}
                                    </p>
                                    <p>
                                        <strong>Role:</strong> {session.user?.role}
                                    </p>
                                    <p>
                                        <strong>Email Verified:</strong> {session.user?.emailVerified ? 'Yes' : 'No'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            URL Parameters
                        </h2>
                        <div
                            style={{
                                padding: '0.75rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                            }}
                        >
                            {Object.keys(allParams).length === 0 ? (
                                <p>No URL parameters</p>
                            ) : (
                                Object.entries(allParams).map(([key, value]) => (
                                    <p key={key}>
                                        <strong>{key}:</strong> {value}
                                    </p>
                                ))
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Server Logs
                        </h2>

                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Filter logs..."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                style={{
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                }}
                            />
                            <label
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                            >
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={e => setAutoRefresh(e.target.checked)}
                                />
                                Auto-refresh
                            </label>
                            <button
                                onClick={fetchLogs}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Refresh
                            </button>
                        </div>
                        <div
                            style={{
                                padding: '0.75rem',
                                backgroundColor: '#000',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                color: '#fff',
                            }}
                        >
                            {logs.length === 0 ? (
                                <p style={{ color: '#9ca3af' }}>No logs available</p>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} style={{ marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#9ca3af' }}>
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>{' '}
                                        <span style={{ color: getLogColor(log.level), fontWeight: 'bold' }}>
                                            [{log.level.toUpperCase()}]
                                        </span>{' '}
                                        <span>{log.message}</span>
                                        {log.meta && (
                                            <div style={{ marginLeft: '1rem', color: '#d1d5db' }}>
                                                {JSON.stringify(log.meta, null, 2)}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Environment Info
                        </h2>
                        <div
                            style={{
                                padding: '0.75rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                            }}
                        >
                            <p>
                                <strong>User Agent:</strong> {navigator.userAgent}
                            </p>
                            <p>
                                <strong>Current URL:</strong> {window.location.href}
                            </p>
                            <p>
                                <strong>Timestamp:</strong> {new Date().toISOString()}
                            </p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Actions</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Link
                                href="/login"
                                className={styles.loginLink}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    borderRadius: '0.375rem',
                                    textDecoration: 'none',
                                }}
                            >
                                Back to Login
                            </Link>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => {
                                    const debugInfo = {
                                        session,
                                        status,
                                        urlParams: allParams,
                                        userAgent: navigator.userAgent,
                                        currentUrl: window.location.href,
                                        timestamp: new Date().toISOString(),
                                        recentLogs: logs.slice(-10), // Include last 10 logs
                                    };
                                    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                                    alert('Debug info copied to clipboard');
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Copy Debug Info
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

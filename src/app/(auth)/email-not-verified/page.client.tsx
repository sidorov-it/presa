'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from './page.module.css';

export default function EmailNotVerifiedPage() {
    const { data: session } = useSession();
    const email = session?.user?.email || '';
    const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
    const [error, setError] = useState('');

    const resend = async () => {
        if (!email) return;
        setStatus('loading');
        setError('');
        const res = await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.message || 'Ошибка');
            setStatus('error');
            return;
        }
        setStatus('sent');
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Подтвердите вашу почту</h1>
            <p className={styles.text}>
                Мы отправили письмо на {email}. Перейдите по ссылке, чтобы завершить регистрацию.
            </p>
            {status === 'sent' ? (
                <p className={styles.success}>Письмо отправлено повторно</p>
            ) : (
                <button onClick={resend} disabled={status === 'loading'} className={styles.button}>
                    {status === 'loading' ? 'Отправка...' : 'Отправить письмо ещё раз'}
                </button>
            )}
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}

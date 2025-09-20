'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './page.module.css';

interface VerifyEmailClientProps {
    isAuthenticated: boolean;
}

export default function VerifyEmailClient({ isAuthenticated }: VerifyEmailClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        setIsLoading(true);

        try {
            if (isAuthenticated) {
                // Force session refresh to update JWT with new email verification status
                // This will trigger the JWT callback which will check the database
                await signOut({ redirect: false });
                // Redirect to login with a flag to auto-login if needed
                window.location.href = '/login?email-verified=true&auto-redirect=true';
            } else {
                // User is not authenticated, redirect to login
                router.push('/login?email-verified=true');
            }
        } catch (error) {
            console.error('Error updating verification status:', error);
            // Fallback: redirect to login
            router.push('/login?email-verified=true');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.title}>Email подтвержден!</h1>
            {/* <p className={styles.text}>
                Ваш адрес электронной почты успешно подтвержден.
            </p> */}
            <button onClick={handleContinue} disabled={isLoading} className={styles.continueButton}>
                {isLoading ? 'Загрузка...' : 'Продолжить'}
            </button>
        </div>
    );
}

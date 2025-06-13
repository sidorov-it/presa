'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MobileWarningOverlay.module.css';

export default function MobileWarningOverlay() {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (!isMobile) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                <p className={styles.text}>Пока что мы не поддерживаем мобильные устройства.</p>
                <button className={styles.backButton} onClick={() => router.back()}>
                    Назад
                </button>
            </div>
        </div>
    );
}

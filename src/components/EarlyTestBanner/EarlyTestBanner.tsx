'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './EarlyTestBanner.module.css';

const excludedPaths = ['/view'];
const STORAGE_KEY = 'earlyTestBannerClosed';

export default function EarlyTestBanner() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const closed = sessionStorage.getItem(STORAGE_KEY);
        if (closed) {
            setIsVisible(false);
        }
    }, []);

    const handleClose = () => {
        sessionStorage.setItem(STORAGE_KEY, 'true');
        setIsVisible(false);
    };

    const isEarlyTest = excludedPaths.some(path => pathname.includes(path));
    if (isEarlyTest || !isVisible) {
        return null;
    }

    return (
        <div className={styles.earlyTestBanner}>
            Сервис находится в стадии раннего тестирования. Мы будем рады любым комментариям и пожеланиям —{' '}
            <a
                href="https://forms.yandex.ru/u/6879f43890fa7b0b0f2f43f1"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
            >
                поделитесь мнением
            </a>
            .
            <button onClick={handleClose} className={styles.closeButton} aria-label="Закрыть уведомление">
                ×
            </button>
        </div>
    );
}

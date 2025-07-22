'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './EarlyTestBanner.module.css';
import { useEarlyTestBanner } from '@/contexts/EarlyTestBannerContext';

export default function EarlyTestBanner() {
    const { isVisible, handleClose } = useEarlyTestBanner();
    if (!isVisible) {
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

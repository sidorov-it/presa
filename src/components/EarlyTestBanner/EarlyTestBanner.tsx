'use client';

import { usePathname } from 'next/navigation';
import styles from './EarlyTestBanner.module.css';

const excludedPaths = ['/view'];

export default function EarlyTestBanner() {
    const pathname = usePathname();
    const isEarlyTest = excludedPaths.some(path => pathname.includes(path));
    if (isEarlyTest) {
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
        </div>
    );
}

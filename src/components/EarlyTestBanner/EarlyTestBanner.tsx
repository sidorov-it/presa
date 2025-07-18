'use client';

import styles from './EarlyTestBanner.module.css';

export default function EarlyTestBanner() {
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

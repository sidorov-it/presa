'use client';
import Link from 'next/link';
import Logo from '@/components/icons/Logo/Logo';
import styles from './style.module.css';

export default function NotFoundPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <span className={styles.logo}>
                        <Logo size="md" href="/dashboard" />
                    </span>
                </div>
            </header>
            <main className={styles.main}>
                <h1 className={styles.title}>404 – Страница не найдена</h1>
                <p className={styles.text}>Запрошенная страница не существует или у вас нет доступа к ней.</p>
            </main>
            <footer className={styles.footer}>
                <div className={styles.footerContent}>Presa - Create beautiful presentations with AI</div>
            </footer>
        </div>
    );
}

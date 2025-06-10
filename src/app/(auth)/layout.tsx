import Link from 'next/link';
import Logo from '@/components/icons/Logo/Logo';
import styles from './layout.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <Link href="/" className={styles.logo}>
                        <Logo size="md" />
                    </Link>
                </div>
            </header>
            <main className={styles.main}>{children}</main>
            <footer className={styles.footer}>
                <div className={styles.footerContent}>Presa - Create beautiful presentations with AI</div>
            </footer>
        </div>
    );
}

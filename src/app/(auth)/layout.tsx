import Logo from '@/components/icons/Logo/Logo';
import styles from './layout.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <Logo size="md" href="/" />
                </div>
            </header>
            <main className={styles.main}>{children}</main>
        </div>
    );
}

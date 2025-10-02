import Link from 'next/link';
import styles from './style.module.css';

export default function Logo({ size = 'md', href = '/dashboard' }: { size?: 'sm' | 'md' | 'lg'; href?: string }) {
    return (
        <Link href={href}>
            <div className={`${styles.logo} ${styles[size]}`} />
        </Link>
    );
}

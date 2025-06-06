import styles from './style.module.css';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    return <div className={`${styles.logo} ${styles[size]}`} />;
}

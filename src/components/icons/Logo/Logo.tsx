import styles from './style.module.css';

export default function Logo() {
    return (
        <div className="flex items-center gap-2">
            <div className={styles.logo} />
        </div>
    );
}

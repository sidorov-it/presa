import styles from './MenuButton.module.css';

export default function MenuButton({
    icon,
    isActive,
    onClick,
}: {
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button className={`${styles.menuButton} ${isActive ? styles.active : ''}`} onClick={onClick} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                onClick();
            }
        }}>
            {icon}
        </button>
    )
}
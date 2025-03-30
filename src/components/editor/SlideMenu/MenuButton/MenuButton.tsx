import styles from './MenuButton.module.css';

export default function MenuButton({
    icon,
    isActive = false,
    color,
    onClick,
}: {
    icon: React.ReactNode;
    isActive?: boolean;
    color?: string;
    onClick: () => void;
}) {
    return (
        <button
            className={`${styles.menuButton} ${isActive ? styles.active : ''}`}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onClick();
                }
            }}
            style={{ color }}
        >
            {icon}
        </button>
    )
}
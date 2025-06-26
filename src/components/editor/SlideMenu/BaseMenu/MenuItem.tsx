import React from 'react';
import styles from './MenuItem.module.css';

export interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
    active?: boolean;
    color?: string;
    disabled?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    onClick,
    className,
    active,
    color,
    disabled = false,
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === 'Space') {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <li>
            <button
                className={`${styles.menuItem}${active ? ` ${styles.active}` : ''}${color === '#f00' ? ` ${styles.danger}` : ''}${className ? ` ${className}` : ''}`}
                onClick={disabled ? undefined : onClick}
                aria-label={label}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={disabled ? undefined : handleKeyDown}
                title={label}
                disabled={disabled}
                style={color ? { color } : undefined}
            >
                <div className={styles.iconWrapper}>{icon}</div>
            </button>
        </li>
    );
};

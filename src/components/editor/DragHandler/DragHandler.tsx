import React, { useEffect, useState } from 'react';
import styles from './DragHandler.module.css';

export default function DragHandler({
    isActive,
    ariaLabel,
    className,
    handleClick,
    handleKeyDown,
    handleDragStart,
    horizontal = false,
    ...props
}: {
    slideId: string,
    isActive: boolean,
    ariaLabel: string,
    className: string,
    handleClick: (e: React.MouseEvent<HTMLDivElement>) => void,
    handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void,
    handleDragStart: (e: React.DragEvent<HTMLDivElement>) => void,
    horizontal?: boolean,
    [key: string]: any,
}) {
    const [isVisible, setIsVisible] = useState(false);

    // Когда компонент монтируется, задерживаем установку видимости,
    // чтобы CSS-анимация сработала
    useEffect(() => {
        // Минимальная задержка для того, чтобы DOM успел создаться
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 10);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`${styles.dragHandle} ${isActive ? styles.active : ''} ${className} ${horizontal ? styles.horizontal : ''} ${isVisible ? styles.visible : ''}`}
            aria-label={ariaLabel}
            draggable="true"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onDragStart={handleDragStart}
            style={{
                ...props.style,
            }}
            // {...props}
        >
            ⋮
        </div>
    );
}
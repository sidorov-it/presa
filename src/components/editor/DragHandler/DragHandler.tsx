import React, { useEffect, useState } from 'react';
import styles from './DragHandler.module.css';
import { useTheme } from '@/components/providers/ThemeProvider';

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
    const { isDarkMode } = useTheme();

    // When component mounts, delay setting visibility to trigger CSS animation
    useEffect(() => {
        // Minimal delay to ensure DOM has been created
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
                // Apply inline styles for dark mode
                ...(isDarkMode && {
                    borderColor: 'white',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }),
                ...(isDarkMode && isActive && {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    borderColor: 'white'
                })
            }}
            {...props}
        >
            ⋮
        </div>
    );
}
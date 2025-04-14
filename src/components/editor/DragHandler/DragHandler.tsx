import React, { useCallback, useEffect, useState } from 'react';
import styles from './DragHandler.module.css';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function DragHandler({
    isActive,
    ariaLabel,
    className,
    handleClick: handleClickProp,
    handleKeyDown,
    handleDragStart,
    horizontal = false,
    dataAttributes,
    style = {},
    title,
}: {
    slideId: string,
    isActive: boolean,
    ariaLabel: string,
    className: string,
    handleClick: (e: React.MouseEvent<HTMLDivElement>) => void,
    handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void,
    handleDragStart: (e: React.DragEvent<HTMLDivElement>) => void,
    horizontal?: boolean,
    dataAttributes?: {
        [key: string]: string,
    },
    style?: React.CSSProperties,
    title?: string,
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

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        handleClickProp(e);
    }, [handleClickProp]);

    return (
        <div
            className={`${styles.dragHandle} ${isActive ? styles.active : ''} ${horizontal ? styles.horizontal : ''} ${isVisible ? styles.visible : ''} ${className}`}
            aria-label={ariaLabel}
            draggable="true"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onDragStart={handleDragStart}
            title={title}
            style={{
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
                }),
                ...style
            }}
            {...dataAttributes}
        >
            ⋮
        </div>
    );
}
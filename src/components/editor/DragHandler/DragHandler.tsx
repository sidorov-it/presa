/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useCallback, useEffect, useState } from 'react';
import styles from './DragHandler.module.css';
import { BsThreeDotsVertical } from 'react-icons/bs';

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
    slideId: string;
    isActive: boolean;
    ariaLabel: string;
    className: string;
    handleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    handleDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    horizontal?: boolean;
    dataAttributes?: {
        [key: string]: string;
    };
    style?: React.CSSProperties;
    title?: string;
}) {
    const [isVisible, setIsVisible] = useState(false);

    // When component mounts, delay setting visibility to trigger CSS animation
    useEffect(() => {
        // Minimal delay to ensure DOM has been created
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 10);

        return () => clearTimeout(timer);
    }, []);

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            handleClickProp(e);
        },
        [handleClickProp]
    );

    let dragHandlerStyle = {
        ...style,
    };

    return (
        <div
            className={`${styles.dragHandle} ${isActive ? styles.active : ''} ${horizontal ? styles.horizontal : ''} ${isVisible ? styles.visible : ''} ${className}`}
            aria-label={ariaLabel}
            draggable="true"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onDragStart={handleDragStart}
            title={title}
            style={dragHandlerStyle}
            {...dataAttributes}
        >
            <BsThreeDotsVertical />
        </div>
    );
}

'use client';

import React, { CSSProperties, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUIStateStore } from '@/store/uiStateStore';
import styles from './BaseMenu.module.css';

export interface BaseMenuProps {
    children: React.ReactNode;
    position?: { x: number; y: number; rect?: DOMRect };
    className?: string;
    style?: CSSProperties;
    onClose?: () => void;
    isForceOpen?: boolean;
}

export const BaseMenu: React.FC<BaseMenuProps> = ({ children, isForceOpen, position, className, style, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const isOpen = useUIStateStore(state => state.isContextMenuOpen) || isForceOpen;

    const baseStyle = {
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
    } as CSSProperties;

    // Calculate menu position
    const getMenuPosition = () => {
        if (!position) return { left: 0, top: 0 };

        const menuWidth = 250; // Estimated menu width
        const defaultMenuHeight = 46; // Estimated menu height

        let left = position.x;
        const top = position.y - defaultMenuHeight - 5;

        // Check right edge
        if (left + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 10;
        }

        return { left, top };
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose?.();
                useUIStateStore.getState().closeContextMenu();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const menuPosition = getMenuPosition();
    const menuStyle: CSSProperties = {
        position: 'absolute',
        left: `${menuPosition.left}px`,
        top: `${menuPosition.top}px`,
        ...baseStyle,
        ...style,
        zIndex: 220,
    };

    if (!isOpen) return null;

    // Render in portal to ensure proper z-index stacking
    return createPortal(
        <div ref={menuRef} className={`${styles.layoutMenu}${className ? ` ${className}` : ''}`} style={menuStyle}>
            <ul className={styles.layoutMenuList}>{children}</ul>
        </div>,
        document.body
    );
};

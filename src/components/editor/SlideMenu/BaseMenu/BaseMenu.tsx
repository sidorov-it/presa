'use client';

import React, { CSSProperties, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMenuStore } from '@/store/menuStore';
import { cn } from '@/utils/cn';
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
    const isOpen = useMenuStore(state => state.isOpen) || isForceOpen;

    // Light theme styles
    const lightThemeStyle = {
        backgroundColor: 'white',
        color: '#333',
        borderColor: '#e2e8f0',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    };

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
                useMenuStore.getState().closeMenu();
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
    const menuStyle = {
        position: 'absolute' as CSSProperties['position'],
        left: `${menuPosition.left}px`,
        top: `${menuPosition.top}px`,
        ...lightThemeStyle,
        ...style,
        zIndex: 9999,
    };

    if (!isOpen) return null;

    // Render in portal to ensure proper z-index stacking
    return createPortal(
        <div ref={menuRef} className={cn(styles.layoutMenu, 'light-theme-only', className)} style={menuStyle}>
            <ul className={styles.layoutMenuList}>{children}</ul>
        </div>,
        document.body
    );
};

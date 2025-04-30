'use client';

import React, { useRef, useEffect } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { SideMenus } from '../menuRegistry';

import styles from './SideMenuRenderer.module.css';

const SideMenuRenderer: React.FC = () => {
    const { sideMenuState } = useMenuStore();
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (sideMenuState.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [sideMenuState.isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                useMenuStore.getState().closeSideMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!sideMenuState.isOpen) return null;

    const SideMenuComponent = SideMenus[sideMenuState.sideMenuId as keyof typeof SideMenus];

    return (
        <div className={styles.sideMenuContainer}>
            {/* Render side panel */}
            {SideMenuComponent && (
                <div ref={menuRef} className={styles.sideMenu}>
                    <SideMenuComponent {...sideMenuState.sideMenuData} />
                </div>
            )}
        </div>
    );
};

export default SideMenuRenderer;

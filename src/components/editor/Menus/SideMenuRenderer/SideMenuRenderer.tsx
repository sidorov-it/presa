'use client';

import React, { useRef, useEffect } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { SideMenus } from '../menuRegistry';

import styles from './SideMenuRenderer.module.css';

const SideMenuRenderer: React.FC = () => {
    const { sideMenuState } = useMenuStore();

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                useMenuStore.getState().closeSideMenu();

                sideMenuState.sideMenuData.onCloseMenu?.();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sideMenuState.sideMenuData]);

    if (!sideMenuState.isOpen) return null;

    const SideMenuComponent = SideMenus[sideMenuState.sideMenuId as keyof typeof SideMenus];

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            className={styles.sideMenuContainer}
            onClick={e => {
                if ((e.target as HTMLElement).classList.contains(styles.sideMenuContainer)) {
                    e.stopPropagation();
                    useMenuStore.getState().closeSideMenu();
                }
            }}
        >
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

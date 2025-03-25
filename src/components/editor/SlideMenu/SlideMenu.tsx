import React, { useRef, useEffect, useState } from 'react';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import styles from './SlideMenu.module.css';

const SlideMenu: React.FC = () => {
    const {
        state,
        closeMenu,
        duplicateSlide,
        deleteSlide
    } = useSlideMenu();

    const menuRef = useRef<HTMLDivElement>(null);

    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

    // Close the menu when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };

        if (state.isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [state.isOpen, closeMenu]);


    useEffect(() => {
        if (state.slideId && state.isOpen) {
            const slideDragHandle = document.querySelector(`[data-slide-drag-handle="${state.slideId}"]`);
            if (slideDragHandle) {
                const rect = slideDragHandle.getBoundingClientRect();
                setPosition({ x: rect.left, y: rect.top + window.scrollY });
            }
        }
    }, [state.isOpen, state.slideId]);

    if (!state.isOpen || !position) {
        return null;
    }


    const menuStyle = {
        position: 'absolute' as const,
        left: `${position.x }px`,
        top: `${position.y + 40}px`,
        zIndex: 1000,
    };

    const handleMenuItemClick = (action: () => void) => {
        action();
    };

    return (
        <div
            ref={menuRef}
            className={`${styles.slideMenu}`}
            style={menuStyle}
        >
            <ul className="divide-x divide-gray-100 flex">
                <li>
                    <button
                        className={`${styles.slideMenuButton}`}
                        onClick={() => handleMenuItemClick(duplicateSlide)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
                        </svg>
                    </button>
                </li>
                {/* <li>
                    <button
                        className="w-full text-left px-1 py-1 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => handleMenuItemClick(mergeWithPreviousSlide)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </button>
                </li>
                <li>
                    <button
                        className="w-full text-left px-1 py-1 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => handleMenuItemClick(mergeWithNextSlide)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </button>
                </li> */}
                <li>
                    <button
                        className={`${styles.slideMenuButton} ${styles.removeButton}`}
                        onClick={() => handleMenuItemClick(deleteSlide)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default SlideMenu; 
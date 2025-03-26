import React, { useRef, useEffect, useState } from 'react';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import styles from './SlideMenu.module.css';

const SlideMenu: React.FC = () => {
    const {
        state,
        closeMenu,
        duplicateSlide,
        deleteSlide,
        duplicateElement,
        deleteElement
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
            const slide = document.querySelector(`[data-slide-id="${state.slideId}"]`);

            if (!slide) {
                return;
            }

            let dragElement = null
            if (state.elementId) {
                dragElement = slide.querySelector(`[data-element-drag-handle="${state.elementId}"]`);
            }

            if (!dragElement) {
                dragElement = document.querySelector(`[data-slide-drag-handle="${state.slideId}"]`);
            }
            
            if (dragElement) {
                const rect = dragElement.getBoundingClientRect();
                setPosition({ x: rect.left, y: rect.top + window.scrollY });
            }

        }
    }, [state.isOpen, state.slideId, state.elementId]);

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

    const handleDuplicateClick = () => {
        if (state.slideId && !state.elementId) {
            duplicateSlide();
        } else if (state.elementId) {
            duplicateElement();
        }
        closeMenu();
    }

    const handleDeleteClick = () => {
        if (state.slideId && !state.elementId) {
            deleteSlide();
        } else if (state.elementId) {
            deleteElement();
        }
    }

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
                        onClick={() => handleDuplicateClick()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
                        </svg>
                    </button>
                </li>

                <li>
                    <button
                        className={`${styles.slideMenuButton} ${styles.removeButton}`}
                        onClick={() => handleDeleteClick()}
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
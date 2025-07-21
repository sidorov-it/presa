/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useCallback, useState, useEffect, useRef } from 'react';
import styles from './ElementsPanel.module.css';
import { menuRegistry } from '@/elements/menuRegistry';
import { useDndStore } from '@/store/dndStore';
import ElementsPanelPopupMenu, { CategoryType } from '../ElementsPanelPopupMenu/ElementsPanelPopupMenu';

const ElementsPanel: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const dragState = useDndStore(state => state.state.dragState);
    const dragFromPanel = useDndStore(
        state => Boolean(state.state.newElement.id || state.state.newSlide)
    );
    const [dragStartTime, setDragStartTime] = useState<number | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleCategoryClick = (category: CategoryType) => {
        if (activeCategory === category) {
            setActiveCategory(null);
        } else {
            setActiveCategory(category);
        }
    };

    const handleClose = useCallback(() => {
        setActiveCategory(null);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                activeCategory &&
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setActiveCategory(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeCategory]);

    // Track drag start time only for drags initiated from the panel
    useEffect(() => {
        if (dragState === 'dragging' && dragFromPanel && dragStartTime === null) {
            setDragStartTime(Date.now());
        }

        if (dragState !== 'dragging' || !dragFromPanel) {
            setDragStartTime(null);
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }
        }
    }, [dragState, dragFromPanel, dragStartTime]);

    // Close menu when drop indicator appears after at least 1s from drag start
    useEffect(() => {
        if (!activeCategory) return;
        if (dragState !== 'dragging' || !dragFromPanel) return;

        const unsubscribe = useDndStore.subscribe((state) => {
            const indicators = state.state.indicators;
            const hasIndicator =
                indicators.elementIndicator ||
                indicators.layoutIndicator ||
                indicators.slideIndicator ||
                indicators.cellIndicator ||
                indicators.tableColumnIndicator ||
                indicators.tableRowIndicator;

            if (hasIndicator) {
                const elapsed = dragStartTime ? Date.now() - dragStartTime : 0;
                const delay = Math.max(1000 - elapsed, 0);
                if (closeTimeoutRef.current)
                    clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = setTimeout(() => {
                    setActiveCategory(null);
                }, delay);
            }
        });

        return () => unsubscribe();
    }, [dragState, activeCategory, dragFromPanel, dragStartTime]);

    return (
        <div ref={containerRef} className={styles.elementsPanel}>
            <div className={styles.elementsPanelContent} data-tour="elements-panel">
                <div className={styles.elementsPanelCategories}>
                    {menuRegistry.map(category => (
                        <div key={category.id} className={`${styles.elementsPanelCategory} group`}>
                            <button
                                className={`${styles.elementsPanelIcon} ${activeCategory === category.id ? styles.elementsPanelIconActive : ''}`}
                                onClick={() => handleCategoryClick(category.id as CategoryType)}
                                aria-label={category.label}
                                aria-pressed={activeCategory === category.id}
                            >
                                {category.Icon && <category.Icon />}
                            </button>

                            {/* Всплывающая подсказка */}
                            <div className={`${styles.elementsPanelTooltip} group-hover:block`}>
                                <div className={styles.elementsPanelTooltipText}>{category.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ElementsPanelPopupMenu
                isOpen={activeCategory !== null}
                category={activeCategory}
                onClose={handleClose}
            />
        </div>
    );
};

export default ElementsPanel;

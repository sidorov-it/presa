/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useRef, memo, useCallback } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { Slide } from '@/types';
import { useDndStore } from '@/store/dndStore';

import styles from './SlidesList.module.css';

// Memoized individual slide component to prevent unnecessary re-renders
const SlideItem = memo(
    ({
        slide,
        index,
        isActive,
        isLastSlide,
        onSlideSelect,
    }: {
        slide: Slide;
        index: number;
        isActive: boolean;
        isLastSlide: boolean;
        onSlideSelect: (slideId: string, scroll: boolean) => void;
    }) => {
        // Extract text content from the first element if available
        const getSlideTitle = useCallback(() => {
            if (!slide.layouts.length || !slide.layouts[0].elements.length) {
                return `Слайд ${index + 1}`;
            }

            const firstElement = slide.layouts[0].elements[0];

            if ('content' in firstElement && typeof firstElement.content === 'string') {
                return firstElement.content.replace(/<[^>]*>/g, '').trim() || `Слайд ${index + 1}`;
            }

            return `Слайд ${index + 1}`;
        }, [slide, index]);

        const slideTitle = getSlideTitle();

        const handleItemClick = useCallback(() => {
            onSlideSelect(slide.id, true);
        }, [slide.id, onSlideSelect]);

        const handleItemKeyDown = useCallback(
            (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSlideSelect(slide.id, true);
                }
            },
            [slide.id, onSlideSelect]
        );

        // Add drag and drop handlers for slide templates
        const setDndIndicators = useDndStore(state => state.setIndicators);
        const dndState = useDndStore(state => state.state);
        const isSlideTemplate = dndState.dragState === 'dragElement' && dndState.newElement.isSlideTemplate;

        const handleDragOver = useCallback(
            (e: React.DragEvent<HTMLDivElement>) => {
                if (!isSlideTemplate) return;

                e.preventDefault();
                e.stopPropagation();

                // Calculate drop position (top/bottom) based on mouse position
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseY = e.clientY;
                const slideMiddle = rect.top + rect.height / 2;
                const position = mouseY < slideMiddle ? 'top' : 'bottom';

                // Set slide indicators for the DnD store
                setDndIndicators({
                    slideIndicator: slide.id,
                    slidePosition: position,
                });

                // Update cursor to show valid drop target
                e.dataTransfer.dropEffect = 'copy';
            },
            [isSlideTemplate, setDndIndicators, slide.id]
        );

        const handleDragLeave = useCallback(() => {
            if (!isSlideTemplate) return;

            // Clear indicators when leaving the drop area
            setDndIndicators({
                slideIndicator: null,
                slidePosition: null,
            });
        }, [isSlideTemplate, setDndIndicators]);

        const handleDrop = useCallback(
            (e: React.DragEvent<HTMLDivElement>) => {
                if (!isSlideTemplate) return;

                e.preventDefault();
                e.stopPropagation();

                // Complete the drop operation
                useDndStore.getState().completeDrop();
            },
            [isSlideTemplate]
        );

        // Highlight indicator based on drag position
        const isTopIndicator = dndState.indicators.slideIndicator === slide.id &&
                              dndState.indicators.slidePosition === 'top';
        const isBottomIndicator = dndState.indicators.slideIndicator === slide.id &&
                                 dndState.indicators.slidePosition === 'bottom';

        return (
            <div
                className={`
                    ${styles.slideContainer}
                    ${isActive ? styles.activeSlide : styles.hoverSlide}
                    ${isLastSlide ? styles.lastSlide : ''}
                    ${isTopIndicator ? styles.topIndicator : ''}
                    ${isBottomIndicator ? styles.bottomIndicator : ''}
                `}
                onClick={handleItemClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                aria-label={`Слайд ${index + 1}: ${slideTitle}`}
                onKeyDown={handleItemKeyDown}
                data-slide-id={slide.id}
            >
                <div className={styles.slide}>
                    <div className={styles.slideContent}>
                        <div className={styles.slideTitle}>
                            <p className={styles.slideTitleText}>{slideTitle}</p>
                            <div className={styles.slidePreview}>
                                <span className={styles.slidePreviewText}>Предпросмотр</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

SlideItem.displayName = 'SlideItem';

interface SlidesListProps {
    presentationId: string;
    activeSlideId: string | null;
    onSlideSelect: (slideId: string, scroll: boolean) => void;
}

const SlidesList: React.FC<SlidesListProps> = memo(({ presentationId, activeSlideId, onSlideSelect }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const panelRef = useRef<HTMLDivElement>(null);

    const { getPresentation } = usePresentationStore();
    const slides = getPresentation(presentationId)?.slides || [];

    // Set the presentation ID for drag and drop operations
    useDndStore(state => state.setPresentationId(presentationId));

    const handleToggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const handleExpandKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggleCollapse();
            }
        },
        [handleToggleCollapse]
    );

    const handleCollapseKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggleCollapse();
            }
        },
        [handleToggleCollapse]
    );

    // if (slides.length === 0) {
    //     return (
    //         <div className={styles.noSlides}>
    //             <p className={styles.noSlidesText}>Нет слайдов</p>
    //         </div>
    //     );
    // }

    // Collapsed view - just show the expand button
    if (isCollapsed) {
        return (
            <div className={styles.collapsedPanel}>
                <button
                    className={styles.collapsedPanelButton}
                    onClick={handleToggleCollapse}
                    aria-label="Развернуть панель слайдов"
                    tabIndex={0}
                    onKeyDown={handleExpandKeyDown}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
        );
    }

    // Expanded view with the list of slides
    return (
        <div className={styles.leftPanel}>
            <div className={styles.leftPanelHeader}>
                <div className={styles.leftPanelHeaderButtons}>
                    <button
                        className={styles.leftPanelHeaderButton}
                        aria-label="Показать в виде таблицы"
                        tabIndex={0}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                    </button>
                    <button
                        className={styles.leftPanelHeaderButton}
                        aria-label="Показать список"
                        tabIndex={0}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                    </button>
                </div>
                <button
                    className={styles.leftPanelHeaderButton}
                    onClick={handleToggleCollapse}
                    aria-label="Свернуть панель слайдов"
                    tabIndex={0}
                    onKeyDown={handleCollapseKeyDown}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <div ref={panelRef} className={styles.leftPanelContent}>
                {slides.length === 0 && (
                    <div className={styles.emptyContainer}>
                        <p className={styles.noSlidesText}>Нет слайдов</p>
                    </div>
                )}
                {slides.length > 0 && (
                    <div className={styles.leftPanelContentSlides}>
                        {slides.map((slide, index) => (
                            <SlideItem
                                key={slide.id}
                                slide={slide}
                                index={index}
                                isActive={slide.id === activeSlideId}
                                isLastSlide={index === slides.length - 1}
                                onSlideSelect={onSlideSelect}
                                presentationId={presentationId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

SlidesList.displayName = 'SlidesList';

export default SlidesList;

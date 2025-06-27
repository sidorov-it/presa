/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useRef, memo, useCallback } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { Slide } from '@/types';
import { useDndStore } from '@/store/dndStore';
import { generateId } from '@/utils/id';
import { useHandleDragStart } from '@/contexts/DragDropContext';

import styles from './SlidesList.module.css';
import Portal from '@/components/Portal';
import { useColorMode } from '@/components/ui/color-mode';
import { LuGripVertical } from 'react-icons/lu';

// Memoized individual slide component to prevent unnecessary re-renders
const SlideItem = memo(
    ({
        slide,
        index,
        isActive,
        isLastSlide,
        onSlideSelect,
        onContextMenu,
    }: {
        slide: Slide;
        index: number;
        isActive: boolean;
        isLastSlide: boolean;
        onSlideSelect: (slideId: string, scroll: boolean) => void;
        onContextMenu: (e: React.MouseEvent, slide: Slide) => void;
    }) => {
        // Extract text content from the first element if available
        const handleDragStart = useHandleDragStart();
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
        const isTopIndicator =
            dndState.indicators.slideIndicator === slide.id && dndState.indicators.slidePosition === 'top';
        const isBottomIndicator =
            dndState.indicators.slideIndicator === slide.id && dndState.indicators.slidePosition === 'bottom';

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
                onContextMenu={e => onContextMenu(e, slide)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                aria-label={`Слайд ${index + 1}: ${slideTitle}`}
                onKeyDown={handleItemKeyDown}
                data-slide-id={slide.id}
            >
                <div
                    className={styles.slide}
                    data-slide-drag-handle={slide.id}
                    draggable
                    onDragStart={e => handleDragStart(e, { slideId: slide.id, dragElementType: 'slide' })}
                >
                    <div className={styles.slideNumberContainer}>
                        <span className={styles.slideNumber}>{index + 1}</span>
                        <span className={styles.dragIcon}>
                            <LuGripVertical />
                        </span>
                    </div>
                    <span className={styles.slideTitleText}>{slideTitle || 'Untitled'}</span>
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
    const [copiedSlide, setCopiedSlide] = useState<Slide | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slide: Slide } | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const { colorMode } = useColorMode();

    const { getPresentation, addEmptySlide, addSlide, deleteSlide, updateSlide } = usePresentationStore();
    const slides = (getPresentation(presentationId)?.slides || []).filter(s => !s.hidden);

    console.log(contextMenu);
    // Set the presentation ID for drag and drop operations
    // useDndStore(state => state.setPresentationId(presentationId));

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

    const handleContextMenu = useCallback(
        (e: React.MouseEvent, slide: Slide) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY + window.scrollY, slide });

            document.addEventListener('click', (ev: MouseEvent) => {
                if (ev.target instanceof HTMLElement && !ev.target.closest('.context-menu')) {
                    setContextMenu(null);
                }
            });
        },
        []
    );

    const handleCopy = useCallback(() => {
        if (!contextMenu) return;
        setCopiedSlide(contextMenu.slide);
        setContextMenu(null);
    }, [contextMenu]);

    const handleAddBelow = useCallback(() => {
        if (!contextMenu) return;
        const index = slides.findIndex(s => s.id === contextMenu.slide.id);
        addEmptySlide(presentationId, index + 1);
        setContextMenu(null);
    }, [contextMenu, slides, presentationId, addEmptySlide]);

    const handleAddCopiedBelow = useCallback(() => {
        if (!contextMenu || !copiedSlide) return;
        const index = slides.findIndex(s => s.id === contextMenu.slide.id);
        const newSlide = { ...copiedSlide, id: generateId() };
        addSlide(presentationId, newSlide, index + 1);
        setContextMenu(null);
    }, [contextMenu, copiedSlide, slides, presentationId, addSlide]);

    const handleHide = useCallback(() => {
        if (!contextMenu) return;
        updateSlide(presentationId, contextMenu.slide.id, { hidden: true });
        setContextMenu(null);
    }, [contextMenu, presentationId, updateSlide]);

    const handleDelete = useCallback(() => {
        if (!contextMenu) return;
        deleteSlide(presentationId, contextMenu.slide.id);
        setContextMenu(null);
    }, [contextMenu, presentationId, deleteSlide]);

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
                <button className={styles.createButton} onClick={() => addEmptySlide(presentationId, slides.length)}>
                    Создать
                </button>
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
                                onContextMenu={handleContextMenu}
                            />
                        ))}
                    </div>
                )}
            </div>
            {contextMenu && (
                <Portal>
                    <div
                        className={`${styles.contextMenu} context-menu ${colorMode === 'dark' ? styles.contextMenuDark : styles.contextMenuLight}`}
                        style={{ top: contextMenu.y - window.scrollY, left: contextMenu.x }}
                        // onMouseLeave={() => setContextMenu(null)}
                    >
                        <div className={styles.contextMenuItem} onClick={handleCopy}>
                            Копировать
                        </div>
                        <div className={styles.contextMenuItem} onClick={handleAddBelow}>
                            Добавить слайд ниже
                        </div>
                        {copiedSlide && (
                            <div className={styles.contextMenuItem} onClick={handleAddCopiedBelow}>
                                Добавить скопированный слайд ниже
                            </div>
                        )}
                        <div className={styles.contextMenuItem} onClick={handleHide}>
                            Скрыть
                        </div>
                        <div className={styles.contextMenuItem} onClick={handleDelete}>
                            Удалить
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
});

SlidesList.displayName = 'SlidesList';

export default SlidesList;

/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useRef, memo, useCallback, useEffect } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { Slide } from '@/types';
import { useSlideDndStore } from '@/store/slideDndStore';
import { cloneSlideWithNewIds } from '@/utils/cloneSlideWithNewIds';
import { LuGripVertical, LuCopy, LuPlus, LuEyeOff, LuTrash2, LuClipboardPaste } from 'react-icons/lu';

import styles from './SlidesList.module.css';
import Portal from '@/components/Portal';
import { useColorMode } from '@/components/ui/color-mode';
import SlidesListDropIndicator from './SlidesListDropIndicator';

const COPIED_SLIDE_STORAGE_KEY = 'copiedSlide';

// Memoized individual slide component to prevent unnecessary re-renders
const SlideItem = memo(
    ({
        slide,
        index,
        // isActive,
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
        // const { colorMode } = useColorMode();
        // Extract text content from the first element if available
        const startSlideDrag = useSlideDndStore(state => state.startDrag);
        const slideDragState = useSlideDndStore(state => state.dragState);
        const setSlideIndicators = useSlideDndStore(state => state.setIndicators);
        const resetSlideDnd = useSlideDndStore(state => state.reset);
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

        const isReordering = slideDragState === 'dragging';

        const handleDragOver = useCallback(
            (e: React.DragEvent<HTMLDivElement>) => {
                if (isReordering) {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const mouseY = e.clientY;
                    const slideMiddle = rect.top + rect.height / 2;
                    const position = mouseY < slideMiddle ? 'top' : 'bottom';

                    setSlideIndicators({
                        slideIndicator: slide.id,
                        slidePosition: position,
                    });
                    e.dataTransfer.dropEffect = 'move';
                }
            },
            [isReordering, setSlideIndicators, slide.id]
        );

        const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
            if (isReordering) {
                const isLeavingToChild = e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node);

                if (!isLeavingToChild) {
                    setSlideIndicators({ slideIndicator: null, slidePosition: null });
                }
            }
        }, [isReordering, setSlideIndicators]);

        return (
            <div
                className={`
                    ${styles.slideContainer}
                    ${styles.hoverSlide}
                    ${isLastSlide ? styles.lastSlide : ''}
                    ${slide.hidden ? styles.hiddenSlide : ''}
                `}
                onClick={handleItemClick}
                onContextMenu={e => onContextMenu(e, slide)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                aria-label={`Слайд ${index + 1}: ${slideTitle}`}
                onKeyDown={handleItemKeyDown}
                data-slide-id={slide.id}
            >
                {slide.hidden && (
                    <div className={styles.hiddenIndicator}>
                        <LuEyeOff />
                    </div>
                )}
                <div
                    className={styles.slide}
                    data-slide-drag-handle={slide.id}
                    draggable
                    onDragStart={e => {
                        startSlideDrag(slide.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', slide.id);
                    }}
                    onDragEnd={resetSlideDnd}
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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [copiedSlide, setCopiedSlide] = useState<Slide | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slide: Slide } | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const { colorMode } = useColorMode();

    const slides = usePresentationStore(state => state.getPresentation(presentationId)?.slides || []);

    const setSlidePresentationId = useSlideDndStore(state => state.setPresentationId);
    const handleDocumentDrop = useSlideDndStore(state => state.handleDocumentDrop);
    const dragState = useSlideDndStore(state => state.dragState);

    useEffect(() => {
        setSlidePresentationId(presentationId);
    }, [presentationId, setSlidePresentationId]);

    // Add global drop handler when dragging starts
    useEffect(() => {
        if (dragState === 'dragging') {
            const handleDrop = (e: DragEvent) => {
                handleDocumentDrop(e);
            };

            const handleDragOver = (e: DragEvent) => {
                e.preventDefault(); // Allow drop

                // Check if we're over the slides list panel
                const slidesListPanel = document.querySelector('.slides-list-panel');
                if (slidesListPanel && !slidesListPanel.contains(e.target as Node)) {
                    // We're outside the slides list - clear indicators
                    useSlideDndStore.getState().setIndicators({
                        slideIndicator: null,
                        slidePosition: null
                    });
                }
            };

            document.addEventListener('drop', handleDrop);
            document.addEventListener('dragover', handleDragOver);

            return () => {
                document.removeEventListener('drop', handleDrop);
                document.removeEventListener('dragover', handleDragOver);
            };
        }
    }, [dragState, handleDocumentDrop]);

    // Load copied slide from localStorage and listen for updates across tabs
    useEffect(() => {
        const stored = localStorage.getItem(COPIED_SLIDE_STORAGE_KEY);
        if (stored) {
            try {
                setCopiedSlide(JSON.parse(stored));
            } catch {
                // ignore parsing errors
            }
        }

        const handleStorage = (e: StorageEvent) => {
            if (e.key === COPIED_SLIDE_STORAGE_KEY && e.newValue) {
                try {
                    setCopiedSlide(JSON.parse(e.newValue));
                } catch {
                    // ignore parsing errors
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

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
            setContextMenu({ x: e.clientX, y: e.clientY, slide });
        },
        []
    );

    const handleCopy = useCallback(() => {
        if (!contextMenu) return;
        setCopiedSlide(contextMenu.slide);
        try {
            localStorage.setItem(COPIED_SLIDE_STORAGE_KEY, JSON.stringify(contextMenu.slide));
        } catch {
            // ignore storage errors
        }
        setContextMenu(null);
    }, [contextMenu]);

    const handleAddBelow = useCallback(() => {
        if (!contextMenu) return;
        const index = slides.findIndex(s => s.id === contextMenu.slide.id);
        usePresentationStore.getState().addEmptySlide(presentationId, index + 1);
        setContextMenu(null);
    }, [contextMenu, slides, presentationId]);

    const handleAddCopiedBelow = useCallback(() => {
        if (!contextMenu || !copiedSlide) return;
        const index = slides.findIndex(s => s.id === contextMenu.slide.id);
        const newSlide = cloneSlideWithNewIds(copiedSlide);
        usePresentationStore.getState().addSlide(presentationId, newSlide, index + 1);
        setContextMenu(null);
    }, [contextMenu, copiedSlide, slides, presentationId]);

    const handleToggleHidden = useCallback(() => {
        if (!contextMenu) return;
        usePresentationStore.getState().updateSlide(presentationId, contextMenu.slide.id, { hidden: !contextMenu.slide.hidden });
        setContextMenu(null);
    }, [contextMenu, presentationId]);

    const handleDelete = useCallback(() => {
        if (!contextMenu) return;
        usePresentationStore.getState().deleteSlide(presentationId, contextMenu.slide.id);
        setContextMenu(null);
    }, [contextMenu, presentationId]);

    useEffect(() => {
        if (!contextMenu) return;

        const handleClickOutside = (ev: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
                setContextMenu(null);
            }
        };

        const updatePosition = () => {
            setContextMenu(prev => {
                if (!prev || !menuRef.current) return prev;
                const menuHeight = menuRef.current.offsetHeight;
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - prev.y;
                const newY = spaceBelow < menuHeight + 10 ? Math.max(10, prev.y - menuHeight) : prev.y;
                if (newY === prev.y) return prev;
                return { ...prev, y: newY };
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);
        document.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu]);

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
        <div className={`${styles.leftPanel} slides-list-panel`}>
            <Portal>
                <button
                    className={`${styles.expandedPanelCollapseButton} ${colorMode === 'light' ? styles.expandedPanelCollapseButtonLight : ''}`}
                    onClick={handleToggleCollapse}
                    aria-label="Свернуть панель слайдов"
                    tabIndex={0}
                    onKeyDown={handleCollapseKeyDown}
                    style={{
                        position: 'fixed',
                        left: '180px', // Width of the panel
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            </Portal>

            <SlidesListDropIndicator />

            <div ref={panelRef} className={styles.leftPanelContent}>
                <button className={styles.createButton} onClick={() => usePresentationStore.getState().addEmptySlide(presentationId, slides.length)}>
                    + Добавить
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
                        ref={menuRef}
                        className={`${styles.contextMenu} context-menu ${colorMode === 'dark' ? styles.contextMenuDark : styles.contextMenuLight}`}
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <div className={styles.contextMenuItem} onClick={handleCopy}>
                            <LuCopy />
                            Копировать
                        </div>
                        <div className={styles.contextMenuItem} onClick={handleAddBelow}>
                            <LuPlus />
                            Добавить слайд ниже
                        </div>
                        {copiedSlide && (
                            <div className={styles.contextMenuItem} onClick={handleAddCopiedBelow}>
                                <LuClipboardPaste />
                                Добавить скопированный слайд ниже
                            </div>
                        )}
                        <div className={styles.contextMenuItem} onClick={handleToggleHidden}>
                            <LuEyeOff />
                            {contextMenu.slide.hidden ? 'Показать' : 'Скрыть'}
                        </div>
                        <div className={styles.contextMenuItem} onClick={handleDelete}>
                            <LuTrash2 />
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

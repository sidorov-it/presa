/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useRef, memo, useCallback } from 'react';
import { Slide } from '@/types';
import styles from './SlidesList.module.css';
import { usePresentationStore } from '@/store/presentationStore';

// Memoized individual slide component to prevent unnecessary re-renders
const SlideItem = memo(({
    slide,
    index,
    isActive,
    isLastSlide,
    onSlideSelect
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

    const handleItemKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSlideSelect(slide.id, true);
        }
    }, [slide.id, onSlideSelect]);

    return (
        <div
            className={`
                border-b border-gray-200 cursor-pointer transition-all
                ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                ${isLastSlide ? 'border-b-0' : ''}
            `}
            onClick={handleItemClick}
            aria-label={`Слайд ${index + 1}: ${slideTitle}`}
            onKeyDown={handleItemKeyDown}
        >
            <div className={styles.slide}>
                <div className="flex items-center">
                    <div className="flex-1">
                        <p className="text-sm truncate max-w-[120px]">{slideTitle}</p>
                        <div className="hidden w-full h-16 bg-gray-50 rounded mt-1.5 border border-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-400">Предпросмотр</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

SlideItem.displayName = 'SlideItem';

interface SlidesListProps {
    presentationId: string;
    activeSlideId: string | null;
    onSlideSelect: (slideId: string, scroll: boolean) => void;
}

const SlidesList: React.FC<SlidesListProps> = memo(({
    presentationId,
    activeSlideId,
    onSlideSelect,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const panelRef = useRef<HTMLDivElement>(null);

    const { getPresentation } = usePresentationStore();
    const slides = getPresentation(presentationId)?.slides || [];

    const handleToggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const handleExpandKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleCollapse();
        }
    }, [handleToggleCollapse]);

    const handleCollapseKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleCollapse();
        }
    }, [handleToggleCollapse]);

    if (slides.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-gray-500">Нет слайдов</p>
            </div>
        );
    }

    // Collapsed view - just show the expand button
    if (isCollapsed) {
        return (
            <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-40">
                <button
                    className="bg-white p-1.5 shadow-sm rounded-r-md text-gray-600 hover:text-blue-600 transition-all duration-300"
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
            <div className="flex justify-between items-center p-2 border-b border-gray-200">
                <div className="flex items-center space-x-1">
                    <button
                        className="p-1.5 text-blue-600 rounded hover:bg-gray-100"
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
                        className="p-1.5 text-gray-500 rounded hover:bg-gray-100"
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
                    className="p-1.5 text-gray-500 hover:text-gray-700 rounded"
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

            <div
                ref={panelRef}
                className="flex-1 overflow-y-auto flex flex-col items-center justify-center"
            >
                <div className="w-full max-w-[220px] mx-auto bg-white shadow-sm rounded-md border border-gray-200 overflow-hidden">
                    {slides.map((slide, index) => (
                        <SlideItem
                            key={slide.id}
                            slide={slide}
                            index={index}
                            isActive={slide.id === activeSlideId}
                            isLastSlide={index === slides.length - 1}
                            onSlideSelect={onSlideSelect}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});

SlidesList.displayName = 'SlidesList';

export default SlidesList;
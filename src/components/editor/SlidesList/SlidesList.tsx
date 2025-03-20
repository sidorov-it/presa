import React, { useState, useEffect, useRef } from 'react';
import { Slide } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import styles from './SlidesList.module.css';

interface SlidesListProps {
    slides: Slide[];
    activeSlideId: string | null;
    onSlideSelect: (slideId: string) => void;
}

const SlidesList: React.FC<SlidesListProps> = ({
    slides,
    activeSlideId,
    onSlideSelect,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { duplicateSlide, deleteSlide } = usePresentationStore();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Ensure active slide is visible in the scrollable container
        if (activeSlideId && panelRef.current) {
            const activeSlideElement = panelRef.current.querySelector(`[data-slide-id="${activeSlideId}"]`);
            activeSlideElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeSlideId]);

    const handleToggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    if (slides.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-gray-500">Нет слайдов</p>
            </div>
        );
    }

    const handleDuplicate = (
        e: React.MouseEvent<HTMLButtonElement>,
        presentationId: string,
        slideId: string
    ) => {
        e.stopPropagation();
        const newSlideId = duplicateSlide(presentationId, slideId);
        onSlideSelect(newSlideId);
    };

    const handleDelete = (
        e: React.MouseEvent<HTMLButtonElement>,
        presentationId: string,
        slideId: string
    ) => {
        e.stopPropagation();
        deleteSlide(presentationId, slideId);

        // Если удалили активный слайд, выбираем первый доступный
        if (activeSlideId === slideId && slides.length > 1) {
            const nextSlideIndex = slides.findIndex((slide) => slide.id === slideId) - 1;
            const nextSlide = slides[nextSlideIndex >= 0 ? nextSlideIndex : 0];
            if (nextSlide && nextSlide.id !== slideId) {
                onSlideSelect(nextSlide.id);
            } else if (slides.length > 1) {
                const alternativeSlide = slides.find((slide) => slide.id !== slideId);
                if (alternativeSlide) {
                    onSlideSelect(alternativeSlide.id);
                }
            }
        }
    };

    // Collapsed view - just show the expand button
    if (isCollapsed) {
        return (
            <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-40">
                <button
                    className="bg-white p-1.5 shadow-sm rounded-r-md text-gray-600 hover:text-blue-600 transition-all duration-300"
                    onClick={handleToggleCollapse}
                    aria-label="Развернуть панель слайдов"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleCollapse();
                        }
                    }}
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
        <div 
            className="absolute left-0 top-0 h-full bg-white shadow-md w-64 z-30 transition-all duration-300 ease-in-out flex flex-col"
        >
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
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleCollapse();
                        }
                    }}
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
                    {slides.map((slide, index) => {
                        const isActive = slide.id === activeSlideId;

                        return (
                            <div
                                key={slide.id}
                                data-slide-id={slide.id}
                                className={`
                                    border-b border-gray-200 cursor-pointer transition-all
                                    ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                                    ${index === slides.length - 1 ? 'border-b-0' : ''}
                                `}
                                onClick={() => onSlideSelect(slide.id)}
                                tabIndex={0}
                                aria-label={`Слайд ${index + 1}: ${slide.title}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSlideSelect(slide.id);
                                    }
                                }}
                            >
                                <div className="p-2.5 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 flex items-center justify-center text-xs text-gray-800 bg-gray-100 rounded-full mr-2.5">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm truncate max-w-[120px]">{slide.title || `Слайд ${index + 1}`}</p>
                                            {/* Placeholder for future preview */}
                                            <div className="hidden w-full h-16 bg-gray-50 rounded mt-1.5 border border-gray-100 flex items-center justify-center">
                                                <span className="text-xs text-gray-400">Предпросмотр</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SlidesList; 
import React from 'react';
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
    const { duplicateSlide, deleteSlide } = usePresentationStore();

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

    return (
        <div className={styles.leftPanel}>
            <div className={styles.container}>
                <ul>
                    {slides.map((slide, index) => {
                        return (
                            <li key={slide.id} className={styles.slide} style={index !== slides.length - 1 ? { transformOrigin: '50% 50% 0px' } : {}}>
                                <div className={styles.slideContent}>
                                    <div className={styles.slidePreviewContainer}>
                                        <div className={styles.slidePreview}>
                                            {slide.title}
                                        </div>
                                        <div className={styles.slideIndex}>
                                            {index + 1}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
    return (
        <div className="space-y-2">
            {slides.map((slide, index) => {
                const isActive = slide.id === activeSlideId;

                return (
                    <div
                        key={slide.id}
                        className={`
              p-2 rounded-lg cursor-pointer transition-all
              hover:bg-gray-100
              ${isActive ? 'bg-blue-50 border border-blue-200' : ''}
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
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Слайд {index + 1}</span>

                            <div className="flex space-x-1">
                                <button
                                    className="p-1 text-gray-500 hover:text-blue-600 rounded"
                                    onClick={(e) => handleDuplicate(e, slide.id.split('-')[0], slide.id)}
                                    aria-label="Дублировать слайд"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleDuplicate(
                                                e as unknown as React.MouseEvent<HTMLButtonElement>,
                                                slide.id.split('-')[0],
                                                slide.id
                                            );
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
                                        <rect x="8" y="8" width="12" height="12" rx="2" />
                                        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                                    </svg>
                                </button>

                                <button
                                    className="p-1 text-gray-500 hover:text-red-600 rounded"
                                    onClick={(e) => handleDelete(e, slide.id.split('-')[0], slide.id)}
                                    aria-label="Удалить слайд"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleDelete(
                                                e as unknown as React.MouseEvent<HTMLButtonElement>,
                                                slide.id.split('-')[0],
                                                slide.id
                                            );
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
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div
                            className="w-full aspect-[16/9] bg-white rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400"
                        >
                            {slide.layouts.length > 0 ? (
                                <div className="w-full h-full bg-white rounded overflow-hidden">
                                    {/* Здесь будет миниатюра слайда */}
                                    <div className="w-full h-full flex items-center justify-center">
                                        {slide.title}
                                    </div>
                                </div>
                            ) : (
                                'Пустой слайд'
                            )}
                        </div>

                        <p className="mt-1 text-xs truncate">{slide.title}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default SlidesList; 
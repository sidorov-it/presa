import React, { useState, useEffect } from 'react';
import { Slide, Layout, LayoutType, Element } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import LayoutComponent from '@/components/layouts/LayoutComponent';
import styles from './SlideEditor.module.css';

interface SlideEditorProps {
    slide: Slide;
    presentationId: string;
    handleSelectSlide: (slideId: string) => void;
    isSelected: boolean;
}

const SlideEditor: React.FC<SlideEditorProps> = ({
    slide,
    presentationId,
    isSelected,
    handleSelectSlide,
}) => {
    const { updateSlide, addLayout, deleteLayout, updateLayout, addSlide } = usePresentationStore();
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Обработчик для обновления заголовка слайда
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSlide(presentationId, slide.id, { title: e.target.value });
    };

    // Обработчики для drag-and-drop
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));

            if (data.type === 'layout') {
                const layoutType = data.layoutType as LayoutType;

                // Создаем новый макет
                const newLayout: Omit<Layout, 'id'> = {
                    type: layoutType,
                    elements: [],
                    style: {},
                };

                // Добавляем макет на слайд
                const newLayoutId = addLayout(presentationId, slide.id, newLayout);
                setSelectedLayoutId(newLayoutId);
            }
        } catch (error) {
            console.error('Error parsing drag data:', error);
        }
    };

    // Обработчик для выбора макета
    const handleSelectLayout = (layoutId: string) => {
        setSelectedLayoutId(layoutId);
    };

    // Обработчик для удаления макета
    const handleDeleteLayout = (layoutId: string) => {
        deleteLayout(presentationId, slide.id, layoutId);
        if (selectedLayoutId === layoutId) {
            setSelectedLayoutId(null);
        }
    };

    // Обработчик для клика по слайду (снятие выделения с макета)
    const handleSlideClick = () => {
        setSelectedLayoutId(null);
    };

    // Обработчик для добавления нового слайда после текущего
    const handleAddSlideAfter = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        
        // Получаем презентацию из хранилища
        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        
        if (!presentation) return;
        
        // Находим индекс текущего слайда
        const currentSlideIndex = presentation.slides.findIndex(s => s.id === slide.id);
        
        if (currentSlideIndex === -1) return;
        
        // Добавляем новый слайд
        const newSlideId = addSlide(presentationId);
        
        // Перемещаем новый слайд на позицию после текущего
        const newSlideIndex = presentation.slides.length - 1; // Индекс нового слайда (последний)
        usePresentationStore.getState().reorderSlides(
            presentationId, 
            newSlideIndex, 
            currentSlideIndex + 1
        );
        
        // Выбираем новый слайд
        handleSelectSlide(newSlideId);
    };

    // Получаем стиль фона слайда
    const getBackgroundStyle = () => {
        if (slide.background?.type === 'color') {
            return { backgroundColor: slide.background.value };
        } else if (slide.background?.type === 'image') {
            return {
                backgroundImage: `url(${slide.background.value})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            };
        }
        return {};
    };

    // Определяем классы для слайда
    const getSlideClassName = () => {
        let className = styles.slideWrapper;
        
        if (isSelected) {
            className += ` ${styles.slideSelected}`;
        } else if (isHovered) {
            className += ` ${styles.slideHovered}`;
        }
        
        return className;
    };

    // Обработчики наведения мыши
    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div 
            className={styles.slide} 
            onMouseEnter={() => {
                handleMouseEnter();
                handleSelectSlide(slide.id);
            }}
            onMouseLeave={handleMouseLeave}
        >
            {/* Обертка для слайда с применением стилей границы */}
            <div className={getSlideClassName()}>
                <div
                    className={`relative min-h-20 overflow-auto w-full`}
                    style={{
                        ...slide.style,
                        ...getBackgroundStyle(),
                    }}
                    onClick={handleSlideClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Контейнер для макетов */}
                    <div className="relative w-full h-full p-8 mt-10">
                        {/* Рендерим макеты */}
                        {slide.layouts.map((layout) => (
                            <div
                                key={layout.id}
                                className="relative mb-4 h-auto"
                                style={{ minHeight: '200px' }}
                            >
                                <LayoutComponent
                                    layout={layout}
                                    presentationId={presentationId}
                                    slideId={slide.id}
                                    isSelected={selectedLayoutId === layout.id}
                                    onSelect={() => handleSelectLayout(layout.id)}
                                    onDelete={() => handleDeleteLayout(layout.id)}
                                />
                            </div>
                        ))}

                        {/* Подсказка для пустого слайда */}
                        {slide.layouts.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                                <p className="text-lg">Перетащите макет на слайд</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.slideDivider + ' ' + (isHovered ? styles.slideDividerHovered : '')}>
                <div className={styles.buttons}>
                    <button 
                        className={styles.slideDividerButton}
                        onClick={handleAddSlideAfter}
                        aria-label="Добавить слайд"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SlideEditor; 
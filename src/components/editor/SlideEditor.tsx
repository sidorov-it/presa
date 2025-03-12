import React, { useState, useEffect } from 'react';
import { Slide, Layout, LayoutType, Element } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import LayoutComponent from '../layouts/LayoutComponent';
import { generateId } from '@/utils/helpers';

interface SlideEditorProps {
    slide: Slide;
    presentationId: string;
}

const SlideEditor: React.FC<SlideEditorProps> = ({
    slide,
    presentationId,
}) => {
    const { updateSlide, addLayout, deleteLayout, updateLayout } = usePresentationStore();
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);

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

    // Получаем стиль фона слайда
    const getBackgroundStyle = () => {
        if (slide.background.type === 'color') {
            return { backgroundColor: slide.background.value };
        } else if (slide.background.type === 'image') {
            return {
                backgroundImage: `url(${slide.background.value})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            };
        }
        return {};
    };

    return (
        <div
            className={`
        relative
        w-full
        h-full
        overflow-auto
        ${isDraggingOver ? 'bg-blue-50' : ''}
      `}
            style={{
                ...slide.style,
                ...getBackgroundStyle(),
            }}
            onClick={handleSlideClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Заголовок слайда (виден только в режиме редактирования) */}
            <div className="absolute top-4 left-4 z-10">
                <input
                    type="text"
                    value={slide.title}
                    onChange={handleTitleChange}
                    className="px-2 py-1 bg-white bg-opacity-80 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Заголовок слайда"
                    aria-label="Заголовок слайда"
                />
            </div>
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
    );
};

export default SlideEditor; 
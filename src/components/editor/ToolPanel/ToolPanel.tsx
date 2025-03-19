import React, { useState } from 'react';
import { LayoutType, ElementType } from '@/types';
import styles from './ToolPanel.module.css';

interface ToolPanelProps {
  presentationId: string;
  slideId: string;
}

type CategoryType = 'templates' | 'layouts' | 'elements' | 'images' | 'videos';

interface ToolCategoryItem {
  id: string;
  title: string;
  icon: React.ReactNode;
}

// Компонент всплывающего меню для категории
interface PopupMenuProps {
  isOpen: boolean;
  category: CategoryType | null;
  onClose: () => void;
  presentationId: string;
  slideId: string;
}

const PopupMenu: React.FC<PopupMenuProps> = ({ isOpen, category, onClose, presentationId, slideId }) => {
    // Макеты, доступные для добавления
    const layouts: { type: LayoutType; title: string; icon: React.ReactNode }[] = [
        {
            type: 'single-column',
            title: 'Одна колонка',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
            ),
        },
        {
            type: 'two-columns',
            title: 'Две колонки',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="8" height="18" rx="1" />
                    <rect x="13" y="3" width="8" height="18" rx="1" />
                </svg>
            ),
        },
        {
            type: 'three-columns',
            title: 'Три колонки',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="4" height="18" rx="1" />
                    <rect x="10" y="3" width="4" height="18" rx="1" />
                    <rect x="17" y="3" width="4" height="18" rx="1" />
                </svg>
            ),
        },
        {
            type: 'four-columns',
            title: 'Четыре колонки',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="4" height="18" rx="1" />
                    <rect x="8" y="3" width="4" height="18" rx="1" />
                    <rect x="14" y="3" width="4" height="18" rx="1" />
                    <rect x="20" y="3" width="4" height="18" rx="1" />
                </svg>
            ),
        },
        {
            type: 'image-text',
            title: 'Изображение + текст',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="8" height="18" rx="1" />
                    <rect x="13" y="3" width="8" height="6" rx="1" />
                    <rect x="13" y="11" width="8" height="10" rx="1" />
                </svg>
            ),
        },
        {
            type: 'text-image',
            title: 'Текст + изображение',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="13" y="3" width="8" height="18" rx="1" />
                    <rect x="3" y="3" width="8" height="6" rx="1" />
                    <rect x="3" y="11" width="8" height="10" rx="1" />
                </svg>
            ),
        },
        {
            type: 'cards',
            title: 'Карточки',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            ),
        },
        {
            type: 'blank',
            title: 'Пустой макет',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                </svg>
            ),
        },
    ];

    // Шаблоны слайдов
    const templates: ToolCategoryItem[] = [
        {
            id: 'title',
            title: 'Титульный',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M8 12h8" />
                    <path d="M12 8v8" />
                </svg>
            ),
        },
        {
            id: 'content',
            title: 'Контент',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16" />
                    <path d="M4 11h16" />
                    <path d="M4 15h10" />
                </svg>
            ),
        },
        {
            id: 'section',
            title: 'Секция',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M8 12h8" />
                </svg>
            ),
        },
    ];

    // Элементы, доступные для добавления
    const elements: { type: ElementType; title: string; icon: React.ReactNode }[] = [
        {
            type: 'text',
            title: 'Текст',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
            ),
        },
        {
            type: 'heading',
            title: 'Заголовок',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h16" />
                    <path d="M4 6h16" />
                    <path d="M4 18h12" />
                </svg>
            ),
        },
        {
            type: 'paragraph',
            title: 'Параграф',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6h4" />
                    <path d="M2 12h9" />
                    <path d="M2 18h4" />
                    <path d="M12 12h6" />
                    <path d="M12 18h6" />
                </svg>
            ),
        },
        {
            type: 'list',
            title: 'Список',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
            ),
        },
        {
            type: 'divider',
            title: 'Разделитель',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
            ),
        },
        {
            type: 'chart',
            title: 'Диаграмма',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
            ),
        },
        {
            type: 'button',
            title: 'Кнопка',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
                    <path d="M16 12h.01" />
                    <path d="M13 12h.01" />
                    <path d="M10 12h.01" />
                </svg>
            ),
        },
    ];

    // Изображения
    const images: ToolCategoryItem[] = [
        {
            id: 'image-upload',
            title: 'Загрузить',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            ),
        },
        {
            id: 'image-gallery',
            title: 'Галерея',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            ),
        },
    ];

    // Видео
    const videos: ToolCategoryItem[] = [
        {
            id: 'video-upload',
            title: 'Загрузить',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <line x1="10" y1="8" x2="14" y2="12" />
                    <line x1="14" y1="8" x2="10" y2="12" />
                </svg>
            ),
        },
        {
            id: 'video-embed',
            title: 'Вставить',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
            ),
        },
    ];

    // Обработчики для drag-n-drop
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemType: 'layout' | 'element' | 'template', itemData: any) => {
        const dragData = {
            type: itemType,
            ...itemData,
        };

        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'copy';
    };

    // Функция для получения содержимого на основе категории
    const getPopupContent = () => {
        switch (category) {
        case 'templates':
            return (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Шаблоны слайдов</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 cursor-grab bg-white"
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'template', { templateId: template.id })}
                                aria-label={`Шаблон: ${template.title}`}
                            >
                                <div className="mb-2 text-gray-600 flex justify-center">
                                    {template.icon}
                                </div>
                                <p className="text-xs text-center text-gray-800">{template.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'layouts':
            return (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Макеты</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {layouts.map((layout) => (
                            <div
                                key={layout.type}
                                className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 cursor-grab bg-white"
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'layout', { layoutType: layout.type })}
                                aria-label={`Макет: ${layout.title}`}
                            >
                                <div className="mb-2 text-gray-600 flex justify-center">
                                    {layout.icon}
                                </div>
                                <p className="text-xs text-center text-gray-800">{layout.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'elements':
            return (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Базовые элементы</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {elements.map((element) => (
                            <div
                                key={element.type}
                                className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 cursor-grab bg-white"
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'element', { elementType: element.type })}
                                aria-label={`Элемент: ${element.title}`}
                            >
                                <div className="mb-2 text-gray-600 flex justify-center">
                                    {element.icon}
                                </div>
                                <p className="text-xs text-center text-gray-800">{element.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'images':
            return (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Изображения</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 cursor-pointer bg-white"
                                aria-label={`Изображение: ${image.title}`}
                            >
                                <div className="mb-2 text-gray-600 flex justify-center">
                                    {image.icon}
                                </div>
                                <p className="text-xs text-center text-gray-800">{image.title}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-md">
                        <div className="text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a3 3 0 01-3-3V6a3 3 0 013-3h10a3 3 0 013 3v7a3 3 0 01-3 3H7zm10-6h.01"
                                />
                            </svg>
                            <p className="mt-1 text-xs font-medium text-gray-900">
                  Перетащите изображение или выберите файл
                            </p>
                            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF до 10MB</p>
                        </div>
                    </div>
                </div>
            );

        case 'videos':
            return (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Видео</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 cursor-pointer bg-white"
                                aria-label={`Видео: ${video.title}`}
                            >
                                <div className="mb-2 text-gray-600 flex justify-center">
                                    {video.icon}
                                </div>
                                <p className="text-xs text-center text-gray-800">{video.title}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                Вставьте URL видео (YouTube, Vimeo)
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="text"
                                className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                                placeholder="https://youtube.com/watch?v="
                            />
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
        }
    };

    if (!isOpen || !category) return null;

    return (
        <div className={styles.popupMenu}>
            <div className="bg-white rounded-lg shadow-lg p-4 w-64">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                        {category === 'templates' && 'Шаблоны слайдов'}
                        {category === 'layouts' && 'Макеты'}
                        {category === 'elements' && 'Базовые элементы'}
                        {category === 'images' && 'Изображения'}
                        {category === 'videos' && 'Видео'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        aria-label="Закрыть"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                {getPopupContent()}
            </div>
        </div>
    );
};

const ToolPanel: React.FC<ToolPanelProps> = ({ presentationId, slideId }) => {
    const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);

    // Категории в панели инструментов
    const toolCategories: { type: CategoryType; title: string; icon: React.ReactNode; tooltip: string }[] = [
        {
            type: 'templates',
            title: 'Шаблоны',
            tooltip: 'Готовые шаблоны слайдов',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <rect x="7" y="7" width="10" height="10" rx="1" />
                </svg>
            ),
        },
        {
            type: 'layouts',
            title: 'Макеты',
            tooltip: 'Макеты слайдов',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="8" height="8" rx="1" />
                    <rect x="13" y="3" width="8" height="8" rx="1" />
                    <rect x="3" y="13" width="8" height="8" rx="1" />
                    <rect x="13" y="13" width="8" height="8" rx="1" />
                </svg>
            ),
        },
        {
            type: 'elements',
            title: 'Элементы',
            tooltip: 'Базовые элементы',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <path d="M9 20h6" />
                    <path d="M12 4v16" />
                </svg>
            ),
        },
        {
            type: 'images',
            title: 'Изображения',
            tooltip: 'Добавить изображение',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            ),
        },
        {
            type: 'videos',
            title: 'Видео',
            tooltip: 'Добавить видео',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
            ),
        },
    ];

    const handleButtonClick = (category: CategoryType) => {
        if (activeCategory === category) {
            setActiveCategory(null);
        } else {
            setActiveCategory(category);
        }
    };

    return (
        <div className={styles.toolPanel}>
            <div className="bg-white rounded-lg shadow-lg py-2 px-1">
                <div className="space-y-3">
                    {toolCategories.map((category) => (
                        <div key={category.type} className="relative group">
                            <button
                                className={`p-2 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 ${
                                    activeCategory === category.type ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                                }`}
                                onClick={() => handleButtonClick(category.type)}
                                aria-label={category.title}
                            >
                                {category.icon}
                            </button>
              
                            {/* Всплывающая подсказка */}
                            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 hidden group-hover:block z-10">
                                <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap text-right">
                                    {category.tooltip}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <PopupMenu
                isOpen={activeCategory !== null}
                category={activeCategory}
                onClose={() => setActiveCategory(null)}
                presentationId={presentationId}
                slideId={slideId}
            />
        </div>
    );
};

export default ToolPanel; 
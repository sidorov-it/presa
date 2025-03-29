import React, { useCallback, useState } from 'react';
import { elementsRegistry } from '@/elements/registry';
import styles from './ElementsPanel.module.css';
import { useDnd } from '@/contexts/DragDropContext';

interface ElementsPanelProps {
    presentationId: string;
    slideId: string;
}

type CategoryType = 'basic' | 'image' | 'video' | 'charts';

interface PopupMenuProps {
    isOpen: boolean;
    category: CategoryType | null;
    onClose: () => void;
    presentationId: string;
    slideId: string;
}

const PopupMenu: React.FC<PopupMenuProps> = ({ isOpen, category, onClose, presentationId, slideId }) => {
    // Обработчики для drag-n-drop
    const { handleNewElementDragStart } = useDnd();

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, element: any) => {
        handleNewElementDragStart(e, element.id, element.defaultProps);
    };

    // Функция для получения содержимого на основе категории
    const getPopupContent = () => {
        if (!category) return null;

        const categoryData = elementsRegistry.find(cat => cat.id === category);
        if (!categoryData) return null;

        const handleButtonClick = (category: string) => {
            console.log(category);
        };

        return (
            <div>
                {categoryData.subCategories ? (
                    // Для категорий с подкатегориями (например, basic)
                    <div className="space-y-4">
                        {categoryData.subCategories.map(subCategory => (
                            <div key={subCategory.id}>
                                {subCategory.label && (
                                    <div className="text-sm font-semibold text-gray-900 mb-2">{subCategory.label}</div>
                                )}
                                <div className="grid grid-cols-3 gap-2">
                                    {subCategory.elements.map(element => (
                                        <div
                                            key={element.id}
                                            className={`${styles.elementItem}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, element)}
                                            aria-label={`${subCategory.label}: ${element.label}`}
                                            onClick={() => handleButtonClick(subCategory.id)}
                                        >
                                            {element.Icon && <element.Icon />}
                                            <div className="text-xs text-center text-gray-800">{element.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Для категорий без подкатегорий (например, image, video, charts)
                    <div className="grid grid-cols-3 gap-2">
                        {categoryData.elements!.map(element => (
                            <div
                                key={element.id}
                                className="border border-gray-200 rounded-lg p-2 hover:border-blue-500 cursor-grab bg-white"
                                draggable
                                onDragStart={(e) => handleDragStart(e, element)}
                                aria-label={element.label}
                            >
                                <div className="text-xs text-center text-gray-800">{element.label}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen || !category) return null;

    return (
        <div className={styles.popupMenu}>
            <div className="bg-white rounded-lg shadow-lg p-4 w-80">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                        {elementsRegistry.find(cat => cat.id === category)?.label}
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

const ElementsPanel: React.FC<ElementsPanelProps> = ({ presentationId, slideId }) => {
    const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);

    const handleButtonClick = (category: CategoryType) => {
        if (activeCategory === category) {
            setActiveCategory(null);
        } else {
            setActiveCategory(category);
        }
    };

    const handleClose = useCallback(() => {
        setActiveCategory(null);
    }, []);

    return (
        <div className={styles.elementsPanel}>
            <div className="bg-white rounded-lg shadow-lg py-2 px-1">
                <div className="space-y-3">
                    {elementsRegistry.map((category) => (
                        <div key={category.id} className="relative group">
                            <button
                                // className={`p-2 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 ${activeCategory === category.id ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                                className={`${styles.elementsPanelIcon} ${activeCategory === category.id ? styles.elementsPanelIconActive : ''}`}
                                onClick={() => handleButtonClick(category.id as CategoryType)}
                                aria-label={category.label}
                            >
                                {category.Icon && <category.Icon />}
                            </button>

                            {/* Всплывающая подсказка */}
                            <div className={`${styles.elementsPanelTooltip} group-hover:block`}>
                                <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap text-right">
                                    {category.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <PopupMenu
                isOpen={activeCategory !== null}
                category={activeCategory}
                onClose={handleClose}
                presentationId={presentationId}
                slideId={slideId}
            />
        </div>
    );
};

export default ElementsPanel; 
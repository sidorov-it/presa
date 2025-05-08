/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useCallback, useState } from 'react';
import { getNewElement } from '@/elements/registry';
import styles from './ElementsPanel.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import { BaseElement } from '@/types';
import { menuRegistry, MenuItem, SLIDE_TEMPLATE_TYPES } from '@/elements/menuRegistry';
import { useDndStore } from '@/store/dndStore';

interface ElementsPanelProps {
    presentationId: string;
    slideId: string;
}

type CategoryType = 'basic' | 'media' | 'charts' | 'smart-layouts' | 'slide-templates';

interface PopupMenuProps {
    isOpen: boolean;
    category: CategoryType | null;
    presentationId: string;
    slideId: string;
    onClose: () => void;
}

const PopupMenu: React.FC<PopupMenuProps> = ({ isOpen, category, onClose, slideId, presentationId }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, element: MenuItem) => {
        e.stopPropagation();

        // Check if this is a slide template
        const categoryData = menuRegistry.find(cat => cat.id === category);
        const isSlideTemplate = categoryData?.isSlideTemplate ||
            SLIDE_TEMPLATE_TYPES.includes(element.elementTypeId);

        if (isSlideTemplate) {
            // Start drag with special handling for slide templates
            useDndStore.getState().startNewElementDrag({
                ...element,
                isSlideTemplate: true
            });
        } else {
            // Normal element drag
            useDndStore.getState().startNewElementDrag(element);
        }
    };

    // Функция для добавления элемента при клике
    const handleElementClick = (element: MenuItem) => {
        // Check if this is a slide template
        const categoryData = menuRegistry.find(cat => cat.id === category);
        const isSlideTemplate = categoryData?.isSlideTemplate ||
            SLIDE_TEMPLATE_TYPES.includes(element.elementTypeId);

        if (isSlideTemplate) {
            // Handle slide template click
            const currentSlideIndex = usePresentationStore.getState().getSlideIndex(presentationId, slideId);
            // Add template slide after current slide
            const newSlideId = usePresentationStore.getState().addEmptySlide(presentationId, currentSlideIndex + 1);

            // Apply template to the new slide
            if (element.defaultProps?.elements && Array.isArray(element.defaultProps.elements)) {
                element.defaultProps.elements.forEach(templateElement => {
                    const newElement = getNewElement({
                        elementTypeId: templateElement.type,
                        defaultProps: templateElement.props,
                        elementVariant: templateElement.variant
                    });

                    usePresentationStore.getState().addLayoutWithElement(
                        presentationId,
                        newSlideId,
                        newElement as unknown as BaseElement
                    );
                });
            }
        } else {
            // Normal element click
            const newElement = getNewElement(element);
            usePresentationStore
                .getState()
                .addLayoutWithElement(presentationId, slideId, newElement as unknown as BaseElement);
        }
    };

    // Функция для получения содержимого на основе категории
    const getPopupContent = () => {
        if (!category) return null;

        const categoryData = menuRegistry.find(cat => cat.id === category);
        if (!categoryData) return null;

        return (
            <div className={styles.popupMenuBody}>
                {categoryData.subCategories ? (
                    // Для категорий с подкатегориями (например, basic)
                    <div className={styles.subCategoriesContainer}>
                        {categoryData.subCategories.map(subCategory => (
                            <div key={subCategory.id} className={styles.subCategoryWrapper}>
                                {subCategory.label && (
                                    <div className={styles.subCategoryLabel}>{subCategory.label}</div>
                                )}
                                <div className={styles.subCategoryElements}>
                                    {subCategory.elements.map(element => (
                                        <div
                                            key={element.label}
                                            className={styles.elementItem}
                                            draggable
                                            onDragStart={e => handleDragStart(e, element)}
                                            onClick={() => handleElementClick(element)}
                                            aria-label={`${subCategory.label}: ${element.label}`}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleElementClick(element);
                                                }
                                            }}
                                        >
                                            {element.Icon && <element.Icon />}
                                            <div className={styles.elementItemLabel}>{element.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Для категорий без подкатегорий (например, media, charts, smart-layouts)
                    <div className={styles.subCategoryElements}>
                        {categoryData.elements!.map(element => (
                            <div
                                key={element.label}
                                className={styles.elementItem}
                                draggable
                                onDragStart={e => handleDragStart(e, element)}
                                onClick={() => handleElementClick(element)}
                                aria-label={element.label}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleElementClick(element);
                                    }
                                }}
                            >
                                {element.Icon && <element.Icon />}
                                <div className={styles.elementItemLabel}>{element.label}</div>
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
            <div className={styles.popupMenuContent}>
                <div className={styles.popupMenuHeader}>
                    <h3 className={styles.popupMenuHeaderTitle}>
                        {menuRegistry.find(cat => cat.id === category)?.label}
                    </h3>
                    <button
                        onClick={onClose}
                        className={styles.popupMenuHeaderCloseButton}
                        aria-label="Закрыть"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
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
                {getPopupContent()}
            </div>
        </div>
    );
};

const ElementsPanel: React.FC<ElementsPanelProps> = ({ presentationId, slideId }) => {
    const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);

    const handleCategoryClick = (category: CategoryType) => {
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
            <div className={styles.elementsPanelContent}>
                <div className={styles.elementsPanelCategories}>
                    {menuRegistry.map(category => (
                        <div key={category.id} className={`${styles.elementsPanelCategory} group`}>
                            <button
                                className={`${styles.elementsPanelIcon} ${activeCategory === category.id ? styles.elementsPanelIconActive : ''}`}
                                onClick={() => handleCategoryClick(category.id as CategoryType)}
                                aria-label={category.label}
                                aria-pressed={activeCategory === category.id}
                            >
                                {category.Icon && <category.Icon />}
                            </button>

                            {/* Всплывающая подсказка */}
                            <div className={`${styles.elementsPanelTooltip} group-hover:block`}>
                                <div className={styles.elementsPanelTooltipText}>
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

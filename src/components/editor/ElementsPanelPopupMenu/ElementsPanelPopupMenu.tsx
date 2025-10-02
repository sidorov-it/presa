import { menuRegistry } from '@/elements/menuRegistry';
import { useDndStore } from '@/store/dndStore';
import { usePresentationStore } from '@/store/presentationStore';
import { BaseElement } from '@/types';
import { MenuItem } from '@/types/templates';
import { getNewElement } from '@/utils/getNewElement';
import { getNewLayoutWithTable } from '@/utils/getNewLayoutWithTable';
import { Tooltip } from '@/components/ui/tooltip';

import styles from './ElementsPanelPopupMenu.module.css';
import { useUIStateStore } from '@/store/uiStateStore';

export type CategoryType = 'basic' | 'media' | 'charts' | 'smart-layouts';

interface PElementsPanelPopupMenuProps {
    isOpen: boolean;
    category: CategoryType | null;
    onClose: () => void;
}

const ElementsPanelPopupMenu: React.FC<PElementsPanelPopupMenuProps> = ({ isOpen, category, onClose }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, element: MenuItem) => {
        e.stopPropagation();

        // Start drag with appropriate data
        useDndStore.getState().startNewElementDrag(element);
    };

    // Функция для добавления элемента при клике
    const handleElementClick = (element: MenuItem) => {
        // Check if this is a slide template
        const isSlideTemplate = !!element.templateConfig;

        const isTable = element.elementTypeId.startsWith('table');
        const slideId = useUIStateStore.getState().selectedSlideId;
        const presentationId = useUIStateStore.getState().currentPresentationId;

        if (!slideId || !presentationId) {
            return;
        }

        if (isSlideTemplate) {
            // TODO: Implement slide template click
            // Handle slide template click
            // const currentSlideIndex = usePresentationStore.getState().getSlideIndex(presentationId, slideId);
            // Add template slide after current slide
            // const newSlideId = usePresentationStore.getState().addEmptySlide(presentationId, currentSlideIndex + 1);
            // Apply template to the new slide
            // if (element.defaultProps?.elements && Array.isArray(element.defaultProps.elements)) {
            //     element.defaultProps.elements.forEach(templateElement => {
            //         const newElement = getNewElement({
            //             elementTypeId: templateElement.type,
            //             defaultProps: templateElement.props,
            //             elementVariant: templateElement.variant
            //         });
            //         usePresentationStore.getState().addLayoutWithElement(
            //             presentationId,
            //             newSlideId,
            //             newElement as unknown as BaseElement
            //         );
            //     });
            // }
        } else if (isTable) {
            const tableLayout = getNewLayoutWithTable(element.props?.columns, element.props?.rows);
            usePresentationStore.getState().addTableLayout(presentationId, slideId, tableLayout);

            setTimeout(() => {
                document.querySelector(`[data-layout-id="${tableLayout.id}"]`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }, 300);
        } else {
            // Normal element click
            const newElement = getNewElement(element);
            const { elementId } = usePresentationStore
                .getState()
                .addLayoutWithElement(presentationId, slideId, newElement as unknown as BaseElement);

            setTimeout(() => {
                document.querySelector(`[data-element-id="${elementId}"]`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }, 300);
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
                    <div className={styles.subCategoriesContainer} key={categoryData.id}>
                        {categoryData.subCategories.map(subCategory => (
                            <div key={subCategory.id} className={styles.subCategoryWrapper}>
                                {subCategory.label && (
                                    <div className={styles.subCategoryLabel}>{subCategory.label}</div>
                                )}
                                <div className={styles.subCategoryElements}>
                                    {subCategory.elements.map(element => (
                                        <Tooltip
                                            key={element.label}
                                            content="Перетащите элемент на слайд"
                                            openDelay={300}
                                            closeDelay={100}
                                        >
                                            <div
                                                key={element.label}
                                                className={styles.elementItem}
                                                draggable
                                                onDragStart={e => handleDragStart(e, element)}
                                                onClick={() => handleElementClick(element)}
                                                aria-label={`${subCategory.label}: ${element.label}`}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleElementClick(element);
                                                    }
                                                }}
                                            >
                                                {element.Icon && <element.Icon />}
                                                <div className={styles.elementItemLabel}>{element.label}</div>
                                            </div>
                                        </Tooltip>
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
                                onKeyDown={e => {
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
                    <button onClick={onClose} className={styles.popupMenuHeaderCloseButton} aria-label="Закрыть">
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

export default ElementsPanelPopupMenu;

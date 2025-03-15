'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Slide, Layout, LayoutType, Element, TextElement, ListElement, EditorElement, ImageElement, GridCell, GridStructure } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { GridEditorElement, GridImageElement } from '@/types/grid-elements';
import { usePresentationStore } from '@/store/presentationStore';
import styles from './SlideEditor.module.css';
import GridCellElement from '../GridCellElement';
import { generateGridTemplateAreas, generateGridTemplateColumns, generateGridTemplateRows, getPredefinedGridStructures } from '@/types';
import { recalcPositions } from '@/utils/grid-utils';

interface SlideEditorProps {
    slide: Slide;
    presentationId: string;
    handleSelectSlide: (slideId: string) => void;
    isSelected: boolean;
}

interface TemplateCard {
    id: string;
    title: string;
    icon: React.ReactNode;
    type: LayoutType;
}

// Компонент для слеш-команд
interface SlashCommandsProps {
    isOpen: boolean;
    position: { x: number; y: number };
    onSelect: (command: string) => void;
    onClose: () => void;
}

const SlashCommands: React.FC<SlashCommandsProps> = ({ isOpen, position, onSelect, onClose }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const commands = [
        { id: 'heading', label: 'Заголовок', icon: 'H1' },
        { id: 'paragraph', label: 'Текст', icon: 'T' },
        { id: 'list-bullet', label: 'Маркированный список', icon: '•' },
        { id: 'list-number', label: 'Нумерованный список', icon: '1.' },
        { id: 'image', label: 'Изображение', icon: '🖼️' },
        { id: 'divider', label: 'Разделитель', icon: '—' },
        { id: 'code', label: 'Код', icon: '</>' },
        { id: 'quote', label: 'Цитата', icon: '"' },
    ];

    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        setActiveIndex(prev => (prev + 1) % commands.length);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        setActiveIndex(prev => (prev - 1 + commands.length) % commands.length);
                        break;
                    case 'Enter':
                        e.preventDefault();
                        onSelect(commands[activeIndex].id);
                        break;
                    case 'Escape':
                        e.preventDefault();
                        onClose();
                        break;
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, activeIndex, commands, onSelect, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="absolute z-50 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                width: '240px'
            }}
        >
            <div className="p-2 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Выберите блок</p>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
                {commands.map((command, index) => (
                    <div
                        key={command.id}
                        className={`flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 ${activeIndex === index ? 'bg-blue-50' : ''}`}
                        onClick={() => onSelect(command.id)}
                        onMouseEnter={() => setActiveIndex(index)}
                    >
                        <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 mr-3 text-gray-600 font-medium">
                            {command.icon}
                        </div>
                        <span className="text-gray-700">{command.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const getColumnWidths = (columnsCount: number): string[] => {
    if (columnsCount === 0) {
        return [];
    } else if (columnsCount === 3) {
        return ['33%', '34%', '33%'];
    } else {
        return new Array(columnsCount).fill(`${100 / columnsCount}%`);
    }
}

const SlideEditor: React.FC<SlideEditorProps> = ({
    slide,
    presentationId,
    handleSelectSlide,
    isSelected,
}) => {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
    const [draggedLayoutId, setDraggedLayoutId] = useState<string | null>(null);

    const { addLayout, deleteLayout, updateLayout, addSlide, addElement } = usePresentationStore();

    const editorRef = useRef<HTMLDivElement>(null);
    // Популярные шаблоны для слайдов
    const templates: TemplateCard[] = [
        {
            id: 'title-text',
            title: 'Заголовок и текст',
            type: 'single-column',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16" />
                    <path d="M4 11h16" />
                    <path d="M4 15h10" />
                </svg>
            )
        },
        {
            id: 'two-columns',
            title: 'Две колонки',
            type: 'two-columns',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="8" height="18" rx="1" />
                    <rect x="13" y="3" width="8" height="18" rx="1" />
                </svg>
            )
        },
        {
            id: 'image-text',
            title: 'Изображение и текст',
            type: 'image-text',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="8" height="18" rx="1" />
                    <rect x="13" y="3" width="8" height="6" rx="1" />
                    <rect x="13" y="11" width="8" height="10" rx="1" />
                </svg>
            )
        },
        {
            id: 'card-grid',
            title: 'Сетка карточек',
            type: 'cards',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            )
        },
    ];

    // Обработчик для клика по слайду (начать редактирование если слайд пустой)
    const handleSlideClick = (e: React.MouseEvent) => {
        if (slide.layouts.length === 0) {
            // Создаем новый макет с одной ячейкой
            createDefaultLayout();
        } else {
            setSelectedElementId(null);
        }
    };

    // Создание макета по умолчанию с одним редактором
    const createDefaultLayout = () => {
        // Создаем новый макет с одной ячейкой
        const layoutId = uuidv4();
        const gridStructure = getPredefinedGridStructures('single-column');

        const newLayout: Omit<Layout, 'id'> = {
            type: 'single-column',
            elements: [],
            style: {},
            gridStructure
        };

        // Добавляем макет на слайд
        addLayout(presentationId, slide.id, newLayout);

        // Добавляем элемент редактора в макет
        const editorElement: Omit<GridEditorElement, 'id'> = {
            type: 'editor',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '16px', color: '#333333' },
            zIndex: 1,
            gridArea: gridStructure.rows[0].cells[0].gridArea || `area-${uuidv4()}`, // Добавляем fallback
            placeholder: 'Введите текст...'
        };

        const elementId = addElement(presentationId, slide.id, layoutId, editorElement as any);
        setSelectedElementId(elementId);
        // setShowTemplates(false);
    };

    // Обработчик для начала перетаскивания элемента
    const handleElementDragStart = (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string) => {
        setDraggedElementId(elementId);
        setDraggedLayoutId(layoutId);
    };

    // Обработчик для перетаскивания над элементом
    const handleElementDragOver = (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string, position: 'top' | 'bottom' | 'left' | 'right') => {
        e.preventDefault();

        if (draggedElementId === elementId) return;

        // Remove all drag over classes first
        const elements = document.querySelectorAll(`[data-element-id="${elementId}"]`);
        elements.forEach(el => {
            el.classList.remove(styles.dragOver, styles.dragOverBottom, styles.dragOverLeft, styles.dragOverRight);

            // Add the appropriate class based on the position
            switch (position) {
                case 'top':
                    el.classList.add(styles.dragOver);
                    break;
                case 'bottom':
                    el.classList.add(styles.dragOverBottom);
                    break;
                case 'left':
                    el.classList.add(styles.dragOverLeft);
                    break;
                case 'right':
                    el.classList.add(styles.dragOverRight);
                    break;
            }
        });
    };

    // Обработчик для сброса элемента
    const handleElementDrop = (e: React.DragEvent<HTMLDivElement>, targetElementId: string, targetLayoutId: string, position: 'top' | 'bottom' | 'left' | 'right') => {
        e.preventDefault();

        if (!draggedElementId || !draggedLayoutId) return;

        // Remove all drag over classes
        const elements = document.querySelectorAll(`.${styles.dragOver}, .${styles.dragOverBottom}, .${styles.dragOverLeft}, .${styles.dragOverRight}`);
        elements.forEach(el => {
            el.classList.remove(styles.dragOver, styles.dragOverBottom, styles.dragOverLeft, styles.dragOverRight);
        });

        // If dropping on the same element, do nothing
        if (draggedElementId === targetElementId) {
            resetDragState();
            return;
        }

        // Get the current layout and target layout
        const currentLayout = slide.layouts.find(l => l.id === draggedLayoutId);
        const targetLayout = slide.layouts.find(l => l.id === targetLayoutId);

        if (!currentLayout || !targetLayout) {
            resetDragState();
            return;
        }

        // Get the dragged element
        const draggedElement = currentLayout.elements.find(e => e.id === draggedElementId);

        if (!draggedElement) {
            resetDragState();
            return;
        }

        // Handle vertical dragging (top/bottom)
        if (position === 'top' || position === 'bottom') {
            handleVerticalDrop(draggedElement, currentLayout, targetLayout, targetElementId, position);
        }
        // Handle horizontal dragging (left/right)
        else if (position === 'left' || position === 'right') {
            handleHorizontalDrop(draggedElement, currentLayout, targetLayout, targetElementId, position);
        }

        resetDragState();
    };

    // Reset drag state
    const resetDragState = () => {
        setDraggedElementId(null);
        setDraggedLayoutId(null);
    };

    // Handle vertical drop (top/bottom)
    const handleVerticalDrop = (
        draggedElement: any,
        currentLayout: any,
        targetLayout: any,
        targetElementId: string,
        position: 'top' | 'bottom'
    ) => {
        // If dragging within the same layout
        if (draggedLayoutId === targetLayout.id) {
            // Reorder elements within the layout
            const updatedElements = [...targetLayout.elements];
            const draggedIndex = updatedElements.findIndex((e: any) => e.id === draggedElementId);
            const targetIndex = updatedElements.findIndex((e: any) => e.id === targetElementId);

            // Remove the dragged element
            const [removed] = updatedElements.splice(draggedIndex, 1);

            // Insert it at the new position
            const insertIndex = position === 'top' ? targetIndex : targetIndex + 1;
            updatedElements.splice(insertIndex, 0, removed);

            // Update the layout
            updateLayout(presentationId, slide.id, targetLayout.id, {
                elements: updatedElements
            });
        } else {
            // Moving between layouts
            // Remove from current layout
            const updatedCurrentElements = currentLayout.elements.filter((e: any) => e.id !== draggedElementId);

            // Add to target layout
            const updatedTargetElements = [...targetLayout.elements];
            const targetIndex = updatedTargetElements.findIndex((e: any) => e.id === targetElementId);
            const insertIndex = position === 'top' ? targetIndex : targetIndex + 1;
            updatedTargetElements.splice(insertIndex, 0, draggedElement);

            // Update both layouts
            updateLayout(presentationId, slide.id, currentLayout.id, {
                elements: updatedCurrentElements,
                gridStructure: {
                    ...targetLayout.gridStructure,
                    columnWidths: getColumnWidths(updatedCurrentElements.length)
                }
            });

            // If the current layout is now empty, delete it
            if (updatedCurrentElements.length === 0) {
                deleteLayout(presentationId, slide.id, currentLayout.id);
            }
        }
    };

    // Handle horizontal drop (left/right)
    const handleHorizontalDrop = (
        draggedElement: Element,
        currentLayout: Layout,
        targetLayout: Layout,
        targetElementId: string,
        position: 'left' | 'right'
    ) => {
        // Get the target element
        const targetElement = targetLayout.elements.find((e: any) => e.id === targetElementId);
        if (!targetElement) return;

        // Get the current grid structure
        const gridStructure = { ...targetLayout.gridStructure };

        // Handle dragging within the same layout
        if (currentLayout.id === targetLayout.id) {
            const recalcResult = recalcPositions({
                draggedElement,
                targetElement,
                currentLayout,
                gridStructure,
                position,
                isMoveInCurrentLayout: true,
                targetLayout
            });

            if (!recalcResult) return;

            // Update the layout with the new grid structure and elements
            updateLayout(presentationId, slide.id, targetLayout.id, {
                gridStructure: recalcResult.updatedGridStructure,
                elements: recalcResult.updatedElements,
            });
        } else {
            const recalcResult = recalcPositions({
                draggedElement,
                targetElement,
                currentLayout,
                targetLayout,
                gridStructure,
                position,
                isMoveInCurrentLayout: false
            });

            if (!recalcResult) return;

            if (recalcResult.needRemoveCurrentLayout) {
                deleteLayout(presentationId, slide.id, currentLayout.id);
            } else if (recalcResult.updatedCurrentElements) {
                updateLayout(presentationId, slide.id, currentLayout.id, {
                    elements: recalcResult.updatedCurrentElements,
                });
            }

            updateLayout(presentationId, slide.id, targetLayout.id, {
                gridStructure: recalcResult.updatedGridStructure,
                elements: recalcResult.updatedElements,
            });
        }
    };

    // Обработчик для отмены перетаскивания
    const handleElementDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        // Check if we're leaving the element completely
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
            // Remove drag over classes
            const elements = document.querySelectorAll(
                `.${styles.dragOver}, .${styles.dragOverBottom}, .${styles.dragOverLeft}, .${styles.dragOverRight}`
            );
            elements.forEach(el => {
                el.classList.remove(
                    styles.dragOver,
                    styles.dragOverBottom,
                    styles.dragOverLeft,
                    styles.dragOverRight
                );
            });
        }
    };

    // Рекурсивная функция для рендеринга макетов и их вложенных элементов
    const renderLayoutContent = (layout: Layout) => {
        // Генерируем CSS grid свойства из структуры сетки
        const gridTemplateAreas = generateGridTemplateAreas(layout.gridStructure);
        const gridTemplateColumns = generateGridTemplateColumns(layout.gridStructure);

        // Check if the layout has multiple cells in a row
        const hasMultipleCells = layout.gridStructure.rows[0]?.cells.length > 1;

        return (
            <div
                key={layout.id}
                className={styles.gridContainer}
                style={{
                    display: 'block',
                    width: '100%',
                    marginBottom: '0.5rem',
                    ...layout.style
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateAreas: gridTemplateAreas,
                        gridTemplateColumns: gridTemplateColumns,
                        gridTemplateRows: '1fr', // Always 1 row
                        // gap: '1rem',
                        width: '100%',
                    }}
                >
                    {layout.elements.map((element, index) => {
                        // Check if the element is a Layout by checking if it has the required properties
                        const isLayout = (
                            'type' in element &&
                            'elements' in element &&
                            'gridStructure' in element &&
                            typeof element.type === 'string' &&
                            ['single-column', 'two-columns', 'three-columns', 'four-columns', 'image-text', 'text-image', 'cards', 'icons-with-text', 'blank', 'custom'].includes(element.type as string)
                        );

                        if (isLayout) {
                            // It's a nested layout
                            return renderLayoutContent(element as unknown as Layout);
                        } else {
                            // It's a regular element
                            // Find the cell for this element to determine if it's the last one
                            const cell = layout.gridStructure.rows[0]?.cells.find(c => c.id === element.cellId);
                            const isLastCell = cell ? cell.column === layout.gridStructure.columns : false;

                            return (
                                <GridCellElement
                                    key={`${element.id}-${element.cellId}-${isLastCell ? 'last' : ''}`}
                                    element={element as Element}
                                    presentationId={presentationId}
                                    slideId={slide.id}
                                    layoutId={layout.id}
                                    isSelected={selectedElementId === element.id}
                                    onSelect={() => handleSelectElement(element.id)}
                                    onDelete={() => handleDeleteElement(layout.id, element.id)}
                                    index={index}
                                    onDragStart={handleElementDragStart}
                                    onDragOver={handleElementDragOver}
                                    onDrop={handleElementDrop}
                                    onDragLeave={handleElementDragLeave}
                                    hasMultipleCells={hasMultipleCells}
                                    isLastCell={isLastCell}
                                />
                            );
                        }
                    })}
                </div>
            </div>
        );
    };

    // Обновляем функцию создания макета для поддержки уникальных областей сетки
    const handleSelectTemplate = (template: TemplateCard) => {
        // Создаем новый макет с предопределенной структурой сетки
        const layoutId = uuidv4();
        const gridStructure = getPredefinedGridStructures(template.type);

        const newLayout: Omit<Layout, 'id'> = {
            type: template.type,
            elements: [],
            style: {},
            gridStructure
        };

        // Добавляем макет на слайд
        addLayout(presentationId, slide.id, newLayout);

        // Добавляем элементы в зависимости от типа макета
        if (template.type === 'single-column') {
            // Добавляем заголовок и текст
            const headingElement: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 60 },
                style: { fontSize: '28px', fontWeight: 'bold', color: '#111111' },
                zIndex: 1,
                gridArea: gridStructure.rows[0].cells[0].gridArea || `area-${uuidv4()}`,
                placeholder: 'Введите заголовок...'
            };

            const elementId = addElement(presentationId, slide.id, layoutId, headingElement as any);
            setSelectedElementId(elementId);
        } else if (template.type === 'two-columns') {
            // Добавляем два редактора
            const leftEditor: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
                gridArea: gridStructure.rows[0].cells[0].gridArea || `area-${uuidv4()}`,
                placeholder: 'Левая колонка...'
            };

            const rightEditor: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
                gridArea: gridStructure.rows[0].cells[1].gridArea || `area-${uuidv4()}`,
                placeholder: 'Правая колонка...'
            };

            const leftId = addElement(presentationId, slide.id, layoutId, leftEditor as any);
            addElement(presentationId, slide.id, layoutId, rightEditor as any);
            setSelectedElementId(leftId);
        } else if (template.type === 'image-text') {
            // Добавляем изображение и текст
            const imageElement: Omit<GridImageElement, 'id'> = {
                type: 'image',
                src: 'https://via.placeholder.com/400x300',
                alt: 'Placeholder Image',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: {},
                zIndex: 1,
                gridArea: gridStructure.rows[0].cells[0].gridArea || `area-${uuidv4()}`
            };

            const textEditor: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
                gridArea: gridStructure.rows[0].cells[1].gridArea || `area-${uuidv4()}`,
                placeholder: 'Введите текст...'
            };

            addElement(presentationId, slide.id, layoutId, imageElement as any);
            const textId = addElement(presentationId, slide.id, layoutId, textEditor as any);
            setSelectedElementId(textId);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        // setIsDraggingOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));

            if (data.type === 'layout') {
                const layoutType = data.layoutType as LayoutType;
                handleSelectTemplate(templates.find(t => t.type === layoutType) || templates[0]);
            }
        } catch (error) {
            console.error('Error parsing drag data:', error);
        }
    };

    // Обработчик для выбора элемента
    const handleSelectElement = (elementId: string) => {
        setSelectedElementId(elementId);
    };

    // Обработчик для удаления элемента
    const handleDeleteElement = (layoutId: string, elementId: string) => {
        usePresentationStore.getState().deleteElement(presentationId, slide.id, layoutId, elementId);
        if (selectedElementId === elementId) {
            setSelectedElementId(null);
        }
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
        }

        return className;
    };

    return (
        <div
            className={styles.slide}
            onMouseEnter={() => {
                handleSelectSlide(slide.id);
            }}
        >
            {/* Обертка для слайда с применением стилей границы */}
            <div className={getSlideClassName()}>
                <div
                    ref={editorRef}
                    className={`relative min-h-20 overflow-auto w-full rounded-3xl cursor-text`}
                    style={{
                        ...slide.style,
                        ...getBackgroundStyle(),
                    }}
                    onClick={handleSlideClick}
                    onDrop={handleDrop}
                >
                    {/* Контейнер для содержимого */}
                    <div className="relative w-full h-full p-8 mt-10">
                        {slide.layouts.map((layout) => renderLayoutContent(layout))}
                    </div>

                    <div className={styles.slideDivider}>
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
            </div>
        </div>
    );
};

export default SlideEditor; 
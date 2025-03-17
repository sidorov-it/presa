'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Slide, Layout, LayoutType, Element, GridCell, GridRow, EditorElement } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { GridEditorElement, GridImageElement } from '@/types/grid-elements';
import { usePresentationStore } from '@/store/presentationStore';
import styles from './SlideEditor.module.css';
import GridCellElement from '../GridCellElement';
import { generateGridTemplateAreas, generateGridTemplateColumns, getPredefinedGridStructures } from '@/types';
import { recalcPositions } from '@/utils/grid-utils';
import { generateId } from '@/utils/id';
import { getTextContentFromNodes } from '@tiptap/react';
import { TiptapRef } from '@/components/tiptap/Tiptap';

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
    const tiptapRefs = useRef<Record<string, React.RefObject<TiptapRef>>>({});

    const {
        addLayout,
        deleteLayout,
        updateLayout,
        updateAndPotentiallyDeleteLayout,
        addSlide,
        addElement
    } = usePresentationStore();

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
        const rect = editorRef.current?.getBoundingClientRect();
        if (rect) {
            const positionY = e.clientY - (rect.top ?? 0);
            const slideHeight = rect.height ?? 0;
            const isClickBottom = positionY / slideHeight > 0.5;

            if (slide.layouts.length === 1) {
            } else if (isClickBottom) {
                createDefaultLayout();
            }

        }
    };

    // Создание макета по умолчанию с одним редактором
    const createDefaultLayout = () => {
        // Создаем новый макет с одной ячейкой
        const gridStructure = getPredefinedGridStructures('single-column');

        const cellId = gridStructure.rows[0].cells[0].id;

        const editorElement: EditorElement = {
            id: generateId(8),
            type: 'editor',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '16px', color: '#333333' },
            zIndex: 1,
            placeholder: '',
            cellId
        };

        const newLayout: Omit<Layout, 'id'> = {
            type: 'single-column',
            elements: [editorElement],
            style: {},
            gridStructure
        };

        // Добавляем макет на слайд
        addLayout(presentationId, slide.id, newLayout);

        // Добавляем элемент редактора в макет
        

        // const elementId = addElement(presentationId, slide.id, layoutId, editorElement as any);
        // setSelectedElementId(elementId);
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
        draggedElement: Element,
        currentLayout: Layout,
        targetLayout: Layout,
        targetElementId: string,
        position: 'top' | 'bottom'
    ) => {
        // Find the target element in the target layout
        const targetIndex = targetLayout.elements.findIndex((e: any) => e.id === targetElementId);
        if (targetIndex === -1) return;

        // Get the target element
        const targetElement = targetLayout.elements[targetIndex];

        // Calculate the insert index based on position
        const insertIndex = position === 'top' ? targetIndex : targetIndex + 1;

        // Create updated elements arrays
        const updatedTargetElements = [...targetLayout.elements];
        const updatedCurrentElements = currentLayout.elements.filter((e: any) => e.id !== draggedElement.id);

        // Create a copy of the dragged element to avoid modifying the original
        const draggedElementCopy = { ...draggedElement };

        // If dragging to a different cell, update the cellId
        if (draggedElementCopy.cellId !== targetElement.cellId) {
            draggedElementCopy.cellId = targetElement.cellId;
        }

        // Insert the dragged element at the calculated position
        updatedTargetElements.splice(insertIndex, 0, draggedElementCopy);

        // Check if we need to create a new empty editor in the source cell
        const needNewEmptyEditor = updatedCurrentElements.filter(e => e.cellId === draggedElement.cellId).length === 0;
        
        if (needNewEmptyEditor) {
            // Create a new empty editor element
            const newEditorElement: EditorElement = {
                id: generateId(8),
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 40 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
                placeholder: 'Введите текст...',
                cellId: draggedElement.cellId
            };
            
            // Add the new editor to the current layout
            updatedCurrentElements.push(newEditorElement);
        }

        // Update current layout
        updateLayout(
            presentationId,
            slide.id,
            currentLayout.id,
            {
                elements: updatedCurrentElements,
                gridStructure: {
                    ...currentLayout.gridStructure,
                    columnWidths: getColumnWidths(currentLayout.gridStructure.columns)
                }
            }
        );

        // Update target layout
        updateLayout(presentationId, slide.id, targetLayout.id, {
            elements: updatedTargetElements,
            gridStructure: {
                ...targetLayout.gridStructure,
                columnWidths: getColumnWidths(targetLayout.gridStructure.columns)
            }
        });
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

        // Check if we need to create a new empty editor in the source cell
        const elementsInSameCell = currentLayout.elements.filter(e => e.cellId === draggedElement.cellId && e.id !== draggedElement.id);
        const currentRow = currentLayout.gridStructure.rows.find(r => r.cells.find(c => c.id === draggedElement.cellId));
        const isOnlyOneElementInCell = !currentRow?.cells.some(c => c.id !== draggedElement.cellId);

        const needNewEmptyEditor = elementsInSameCell.length === 0 && !isOnlyOneElementInCell;
        
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

            // If we need to create a new empty editor
            if (needNewEmptyEditor) {
                // Create a new empty editor element
                const newEditorElement: EditorElement = {
                    id: generateId(8),
                    type: 'editor',
                    content: '',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 40 },
                    style: { fontSize: '16px', color: '#333333' },
                    zIndex: 1,
                    placeholder: 'Введите текст...',
                    cellId: draggedElement.cellId
                };
                
                // Add the new editor to the updated elements
                recalcResult.updatedElements.push(newEditorElement);
            }

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

            // If we need to create a new empty editor in the source layout
            if (needNewEmptyEditor) {
                // Create a new empty editor element
                const newEditorElement: EditorElement = {
                    id: generateId(8),
                    type: 'editor',
                    content: '',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 40 },
                    style: { fontSize: '16px', color: '#333333' },
                    zIndex: 1,
                    placeholder: 'Введите текст...',
                    cellId: draggedElement.cellId
                };
                
                // Add the new editor to the current layout
                if (recalcResult.updatedCurrentElements) {
                    recalcResult.updatedCurrentElements.push(newEditorElement);
                }
            }

            // Update current layout
            if (recalcResult.updatedCurrentElements) {
                updateLayout(
                    presentationId,
                    slide.id,
                    currentLayout.id,
                    {
                        elements: recalcResult.updatedCurrentElements,
                    }
                );
            }

            // Update target layout
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
        const hasMultipleCellsInRow = layout.gridStructure.rows.some(row => row.cells.length > 1);

        // Create a map of cellId to column position for sorting
        const cellColumnMap: Record<string, number> = {};
        layout.gridStructure.rows.forEach((row: GridRow) => {
            row.cells.forEach((cell: GridCell) => {
                cellColumnMap[cell.id] = cell.column;
            });
        });

        // Group elements by cell
        const cellElements: Record<string, Element[]> = {};
        layout.elements.forEach(element => {
            if (!cellElements[element.cellId]) {
                cellElements[element.cellId] = [];
            }
            cellElements[element.cellId].push(element);
        });

        // Render each row and its cells
        return (
            <div
                className={styles.layoutContent}
                style={{
                    display: 'grid',
                    gridTemplateAreas,
                    gridTemplateColumns,
                }}
            >
                {layout.gridStructure.rows.map((row: GridRow) => (
                    <React.Fragment key={row.id}>
                        {row.cells.map((cell: GridCell, cellIndex: number) => {
                            const cellId = cell.id;
                            const elements = cellElements[cellId] || [];
                            const isLastCell = cellIndex === row.cells.length - 1;

                            return (
                                <GridCellElement
                                    key={cellId}
                                    elements={elements}
                                    presentationId={presentationId}
                                    slideId={slide.id}
                                    layoutId={layout.id}
                                    index={cellIndex}
                                    hasMultipleCells={hasMultipleCellsInRow}
                                    isLastCell={isLastCell}
                                    slideEditorRef={editorRef}
                                    tiptapRefs={tiptapRefs}
                                    dataElementKey={`${layout.id}-${cellId}`}
                                    onSelect={(element) => handleSelectElement(element.id)}
                                    onDelete={(element) => handleDeleteElement(layout.id, element.id)}
                                    onDragStart={handleElementDragStart}
                                    onDragOver={handleElementDragOver}
                                    onDrop={handleElementDrop}
                                    onDragLeave={handleElementDragLeave}
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
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
                placeholder: 'Левая колонка...'
            };

            const rightEditor: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
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
            };

            const textEditor: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
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
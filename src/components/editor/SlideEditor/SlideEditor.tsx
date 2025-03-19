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

type DndState = {
    dragOverElement: string | null;
    dragOverPosition: 'top' | 'bottom' | 'left' | 'right' | null;
    targetElementId: string | null;
    targetLayoutId: string | null;
};

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
    const dndStateRef = useRef<DndState>({
        dragOverElement: null,
        dragOverPosition: null,
        targetElementId: null,
        targetLayoutId: null,
    });

    const [dndState, setDndState] = useState<DndState>({
        dragOverElement: null,
        dragOverPosition: null,
        targetElementId: null,
        targetLayoutId: null,
    });

    // New state for layout-level drag and drop
    const [layoutDragState, setLayoutDragState] = useState<{
        dragOverLayout: string | null,
        dragOverPosition: 'top' | 'bottom' | null
    }>({
        dragOverLayout: null,
        dragOverPosition: null
    });

    const updateLayoutDragState = (newState: Partial<any>) => {
        setLayoutDragState(prevState => {
            return { ...prevState, ...newState };
        });

        setDndState({
            dragOverElement: null,
            dragOverPosition: null,
            targetElementId: null,
            targetLayoutId: null
        });
    };
    const updateDndState = (newState: Partial<DndState>) => {
        setDndState(prevState => {
            dndStateRef.current = { ...prevState, ...newState };
            return { ...prevState, ...newState };
        });
        setLayoutDragState({
            dragOverLayout: null,
            dragOverPosition: null,
        })
    };
    // const [dragOverElement, setDragOverElement] = useState<string | null>(null);
    // const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
    // const [targetElementId, setTargetElementId] = useState<string | null>(null);
    // const [targetLayoutId, setTargetLayoutId] = useState<string | null>(null);

    const {
        addLayout,
        updateLayout,
        addSlide,
        addElement,
        deleteLayout
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

    useEffect(() => {
        // Create a document-level handler that references current state
        const handleDocumentDragStart = (event: DragEvent) => {
        };

        const handleDocumentDragOver = (event: DragEvent) => {
            // Need to prevent default to allow drop
            event.preventDefault();

            // Check if the drag is happening outside of the slide area
            if (editorRef.current) {
                const editorRect = editorRef.current.getBoundingClientRect();
                const isOutsideSlide =
                    event.clientX < editorRect.left ||
                    event.clientX > editorRect.right ||
                    event.clientY < editorRect.top ||
                    event.clientY > editorRect.bottom;

                if (draggedElementId) {
                    // Set a special state for dropping outside, or you could use a fixed position indicator
                    // setDragOverElement('outside');
                    resetDragState();
                    updateLayoutDragState({
                        dragOverLayout: null,
                        dragOverPosition: null
                    });
                }
            }
        };

        const handleDocumentDrop = (event: DragEvent) => {
            event.preventDefault();

            // Only process if we have dragged element info
            if (draggedElementId && draggedLayoutId) {
                if (dndStateRef.current.targetElementId && dndStateRef.current.targetLayoutId) {
                    // Handle normal element-to-element drop
                    const dragEvent = event as unknown as React.DragEvent<HTMLDivElement>;
                    handleElementDrop(dragEvent);
                } else if (layoutDragState.dragOverLayout && layoutDragState.dragOverPosition) {
                    // Handle layout-level drop
                    handleLayoutDrop();
                }
            }

            // Reset layout drag state
            updateLayoutDragState({
                dragOverLayout: null,
                dragOverPosition: null
            });
        };

        // Add event listeners
        document.addEventListener("dragstart", handleDocumentDragStart);
        // document.addEventListener("dragover", handleDocumentDragOver);
        document.addEventListener("drop", handleDocumentDrop);

        // Clean up event listeners on unmount
        return () => {
            document.removeEventListener("dragstart", handleDocumentDragStart);
            // document.removeEventListener("dragover", handleDocumentDragOver);
            document.removeEventListener("drop", handleDocumentDrop);
        };
    }, [draggedElementId, draggedLayoutId, slide.id]);

    // Обработчик для начала перетаскивания элемента
    const handleElementDragStart = (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string) => {
        e.stopPropagation();

        // Set drag data for internal use
        setDraggedElementId(elementId);
        setDraggedLayoutId(layoutId);

        // Clear any previous drag states
        updateDndState({
            dragOverElement: null,
            dragOverPosition: null,
            targetElementId: null,
            targetLayoutId: null
        });

        // Clear layout drag state
        updateLayoutDragState({
            dragOverLayout: null,
            dragOverPosition: null
        });

        // Set data for external drops (e.g., for file system drop targets)
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
            elementId,
            layoutId
        }));
    };

    const handleElementDragOver = (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string, position: 'top' | 'bottom' | 'left' | 'right') => {
        e.preventDefault();

        if (!draggedElementId || !draggedLayoutId) {
            return;
        }


        // If this is the same element, don't do anything
        if (draggedElementId === elementId) return;

        // Clear any layout-level drag indicators
        updateLayoutDragState({
            dragOverLayout: null,
            dragOverPosition: null
        });

        // Set the element-level drag state
        updateDndState({
            dragOverElement: elementId,
            dragOverPosition: position,
            targetElementId: elementId,
            targetLayoutId: layoutId
        });
    };

    // New function to handle drag over a layout
    const handleLayoutDragOver = (e: React.DragEvent<HTMLDivElement>, layoutId: string) => {
        e.preventDefault();

        if (!draggedElementId || !draggedLayoutId || draggedLayoutId === layoutId) return;

        // Get the layout element
        const layoutElement = e.currentTarget;
        const layoutRect = layoutElement.getBoundingClientRect();

        // Calculate if we're in the top or bottom portion of the layout
        const mouseY = e.clientY;
        const mouseYRelative = mouseY - layoutRect.top;
        const threshold = 30; // Increased threshold for better detection

        // Determine if we're in the top or bottom drop zone
        let position: 'top' | 'bottom' | null = null;

        if (mouseYRelative < threshold) {
            position = 'top';
        } else if (mouseYRelative > layoutRect.height - threshold) {
            position = 'bottom';
        }

        // Only update state if we're in a drop zone
        if (position) {
            // Clear element-level drag state
            updateDndState({
                dragOverElement: null,
                dragOverPosition: null,
                targetElementId: null,
                targetLayoutId: null
            });

            // Set layout-level drag state
            updateLayoutDragState({
                dragOverLayout: layoutId,
                dragOverPosition: position
            });
        } else {
            // Reset layout drag state if not in a drop zone
            updateLayoutDragState({
                dragOverLayout: null,
                dragOverPosition: null
            });
        }
    };

    // Обработчик для сброса элемента
    const handleElementDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        if (!draggedElementId || !draggedLayoutId) {
            return;
        }

        // If dropping on the same element, do nothing
        if (draggedElementId === dndStateRef.current.targetElementId) {
            resetDragState();
            return;
        }

        // Get the current layout and target layout
        const currentLayout = slide.layouts.find(l => l.id === draggedLayoutId);
        const targetLayout = slide.layouts.find(l => l.id === dndStateRef.current.targetLayoutId);

        if (!currentLayout || !targetLayout) {
            resetDragState();
            return;
        }

        // Get the dragged element
        const draggedElement = currentLayout.elements.find(e => e.id === draggedElementId);

        if (!draggedElement || !dndStateRef.current.targetElementId || !dndStateRef.current.targetLayoutId) {
            resetDragState();
            return;
        }

        // Handle vertical dragging (top/bottom)
        if (dndStateRef.current.dragOverPosition === 'top' || dndStateRef.current.dragOverPosition === 'bottom') {
            handleVerticalDrop(draggedElement, currentLayout, targetLayout, dndStateRef.current.targetElementId, dndStateRef.current.dragOverPosition);
        }
        // Handle horizontal dragging (left/right)
        else if (dndStateRef.current.dragOverPosition === 'left' || dndStateRef.current.dragOverPosition === 'right') {
            handleHorizontalDrop(draggedElement, currentLayout, targetLayout, dndStateRef.current.targetElementId, dndStateRef.current.dragOverPosition);
        }

        resetDragState();
    };

    // Reset drag state
    const resetDragState = () => {
        setDraggedElementId(null);
        setDraggedLayoutId(null);
        updateDndState({
            dragOverElement: null,
            dragOverPosition: null,
            targetElementId: null,
            targetLayoutId: null
        });
        // Also reset layout drag state
        updateLayoutDragState({
            dragOverLayout: null,
            dragOverPosition: null
        });
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

        if (targetLayout.elements.length === 1) {
            const layoutIndex = slide.layouts.findIndex(l => l.id === targetLayout.id);

            const insertLayoutIndex = position === 'top' ? layoutIndex : layoutIndex + 1;

            // Create a new layout with a grid that has 1 row and the same number of columns as the current layout
            const newLayout: Omit<Layout, 'id'> = {
                type: 'single-column',
                elements: [draggedElement],
                style: {},
                gridStructure: {
                    columns: 1,
                    columnWidths: ['100%'],
                    rows: [{
                        id: generateId(8),
                        cells: [{
                            id: draggedElement.cellId,
                            column: 1,
                            row: 1,
                            rowSpan: 1,
                            colSpan: 1
                        }]
                    }]
                }
            };

            // Add the new layout to the slide
            addLayout(presentationId, slide.id, newLayout, insertLayoutIndex);
            deleteLayout(presentationId, slide.id, currentLayout.id);
        } else if (targetLayout.id === currentLayout.id) {
            const updatedElements = [...targetLayout.elements].filter((e: any) => e.id !== draggedElement.id);

            // если изменилась ячейка, то смотрим, остались ли в ней другие элементы
            // если нет, то создаем новый элемент
            if (draggedElement.cellId !== targetElement.cellId) {
                const cellElements = updatedElements.filter(e => e.cellId === draggedElement.cellId);
                const isOnlyOneElementInCell = cellElements.length === 0;
                if (isOnlyOneElementInCell) {
                    updatedElements.push({
                        id: generateId(8),
                        type: 'editor',
                        content: '',
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 40 },
                        style: { fontSize: '16px', color: '#333333' },
                        zIndex: 1,
                        cellId: draggedElement.cellId
                    });
                }
            }
            updatedElements.splice(insertIndex, 0, {
                ...draggedElement,
                cellId: targetElement.cellId
            });

            updateLayout(
                presentationId,
                slide.id,
                currentLayout.id,
                {
                    elements: updatedElements,
                    gridStructure: {
                        ...currentLayout.gridStructure,
                        columnWidths: getColumnWidths(currentLayout.gridStructure.columns)
                    }
                }
            );
        } else {
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
        }
    };

    // Handle horizontal drop (left/right)
    const handleHorizontalDrop = (
        draggedElement: Element,
        sourceLayout: Layout,
        targetLayout: Layout,
        targetElementId: string,
        position: 'left' | 'right'
    ) => {
        // Get the target element
        const targetElement = targetLayout.elements.find((e: any) => e.id === targetElementId);
        const targetCell = targetLayout.gridStructure.rows.map(row => row.cells).flat().find(c => c.id === targetElementId);
        if (!targetElement && !targetCell) {
            return;
        }
        const targetGridStructure = { ...targetLayout.gridStructure };
        const sourceRow = sourceLayout.gridStructure.rows.find(r => r.cells.find(c => c.id === draggedElement.cellId));

        // перетасквание на ячейку, когда в строке больше 1 ячейки
        if (targetCell) {
            // считаем новое кол-во колонов
            const newColumnCount = targetGridStructure.columns + 1;
            // находим индекс целевой ячейки
            const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(c => c.id === targetElementId);
            // считаем новые ширины колонов
            const newColumnWidths = getColumnWidths(newColumnCount);

            const newCellPosition = position === 'left' ? targetCellIndex : targetCellIndex + 1;
            // обновляем структуру сетки
            targetGridStructure.columns = newColumnCount;
            targetGridStructure.columnWidths = newColumnWidths;

            // создаем новую ячейку
            const newCellId = generateId(8);
            targetGridStructure.rows[0].cells.splice(newCellPosition, 0, {
                id: newCellId,
                column: newCellPosition + 1,
                row: 1,
                rowSpan: 1,
                colSpan: 1
            });

            targetGridStructure.rows[0].cells.forEach(c => {
                if (c.column >= newCellPosition && c.id !== newCellId) {
                    c.column = c.column + 1;
                }
            })
            targetGridStructure.rows[0].cells.sort((a, b) => a.column - b.column);
            // const updatedElement = {
            //     ...draggedElement,
            //     cellId: newCellId
            // }
            // обновляем ячейку перетаскиваемого элемента
            // draggedElement.cellId = newCellId;

            // если перетаскиваемый элемент в строке с несколькими ячейками, то сначала проверяем, не внутри одного layoyt ли происходит dnd
            // если внутри одного layoyt, то продолжаем обновлять текущий layout
            if (sourceLayout.id === targetLayout.id) {
                const updatedElements = targetLayout.elements.map(el => {
                    if (el.id === draggedElement.id) {
                        return {
                            ...el,
                            cellId: newCellId
                        }
                    }
                    return el;
                });

                const cellElements = updatedElements.filter(el => el.cellId === draggedElement.cellId);

                if (cellElements.length === 0) {
                    const newCellContent: EditorElement = {
                        id: generateId(8),
                        type: 'editor',
                        content: '',
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 40 },
                        style: { fontSize: '16px', color: '#333333' },
                        zIndex: 1,
                        cellId: draggedElement.cellId
                    }

                    updatedElements.push(newCellContent);
                }

                updateLayout(presentationId, slide.id, targetLayout.id, {
                    elements: updatedElements,
                    gridStructure: targetGridStructure,
                });
            } else {
                const updatedElements = [...targetLayout.elements];
                updatedElements.splice(targetCellIndex, 0, {
                    ...draggedElement,
                    cellId: newCellId
                });

                updateLayout(presentationId, slide.id, targetLayout.id, {
                    elements: updatedElements,
                    gridStructure: targetGridStructure,
                });


                if (sourceRow?.cells.length === 1) {
                    deleteLayout(presentationId, slide.id, sourceLayout.id);
                } else {
                    const updatedSourceElements = sourceLayout.elements.filter(el => el.id !== draggedElement.id);
                    const sourceGridStructure = { ...sourceLayout.gridStructure };

                    sourceGridStructure.rows[0].cells = [...sourceGridStructure.rows[0].cells.filter(c => c.id !== draggedElement.cellId)];
                    updateLayout(presentationId, slide.id, sourceLayout.id, {
                        elements: updatedSourceElements,
                        gridStructure: sourceGridStructure,
                    });
                }
            }
            // если в разных layout, то продолжаем обновлять целевой layout
            // проверяем кол-во элементов в его ячейке
            // если элементов больше 1, то ничего не делаем
            // если элементов 1, то вставляем пустой редактор

            // если перетаскиваемый элемент в строке с одной ячейкой, то удаляем его layout
        } else {
            if (!targetElement) return;

            // Check if we need to create a new empty editor in the source cell
            const elementsInSameCell = sourceLayout.elements.filter(e => e.cellId === draggedElement.cellId && e.id !== draggedElement.id);
            const isOnlyOneElementInCell = !sourceRow?.cells.some(c => c.id !== draggedElement.cellId);

            const needNewEmptyEditor = elementsInSameCell.length === 0 && !isOnlyOneElementInCell;

            // Handle dragging within the same layout
            if (sourceLayout.id === targetLayout.id) {
                const recalcResult = recalcPositions({
                    draggedElement,
                    targetElement,
                    currentLayout: sourceLayout,
                    gridStructure: targetGridStructure,
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
                    currentLayout: sourceLayout,
                    targetLayout,
                    gridStructure: targetGridStructure,
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
                } else if (sourceRow?.cells.length === 1 && isOnlyOneElementInCell) {
                    // в строке 1 ячейка с перетаскиваемым элементом, то удаляем layout
                    deleteLayout(presentationId, slide.id, sourceLayout.id);
                } 

                // Update current layout
                if (recalcResult.updatedCurrentElements) {
                    updateLayout(
                        presentationId,
                        slide.id,
                        sourceLayout.id,
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
        }
    };

    // Обработчик для отмены перетаскивания
    const handleElementDragLeave = (e: React.DragEvent<HTMLDivElement>) => { };

    // Handle dragging element to layout boundary
    const handleLayoutDrop = () => {
        if (!draggedElementId || !draggedLayoutId || !layoutDragState.dragOverLayout || !layoutDragState.dragOverPosition) {
            resetDragState();
            return;
        }

    
        // Get the current layout and target layout
        const currentLayout = slide.layouts.find(l => l.id === draggedLayoutId);
        const targetLayout = slide.layouts.find(l => l.id === layoutDragState.dragOverLayout);

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

        // Create a new layout with the dragged element
        const layoutIndex = slide.layouts.findIndex(l => l.id === targetLayout.id);
        const insertLayoutIndex = layoutDragState.dragOverPosition === 'top' ? layoutIndex : layoutIndex + 1;

        // Create a new layout with a grid that has 1 row
        const newLayout: Omit<Layout, 'id'> = {
            type: 'single-column',
            elements: [draggedElement],
            style: {},
            gridStructure: {
                columns: 1,
                columnWidths: ['100%'],
                rows: [{
                    id: generateId(8),
                    cells: [{
                        id: draggedElement.cellId,
                        column: 1,
                        row: 1,
                        rowSpan: 1,
                        colSpan: 1
                    }]
                }]
            }
        };

        // Check if this is the only element in the current layout's cell
        const elementsInSameCell = currentLayout.elements.filter(e => e.cellId === draggedElement.cellId && e.id !== draggedElement.id);

        // If this is the only element in the layout and source layout has only one cell, delete the source layout
        if (currentLayout.elements.length === 1 && currentLayout.gridStructure.rows[0].cells.length === 1) {
            // Add the new layout and delete the old one
            addLayout(presentationId, slide.id, newLayout, insertLayoutIndex);
            deleteLayout(presentationId, slide.id, currentLayout.id);
        } else {
            // Add the new layout
            addLayout(presentationId, slide.id, newLayout, insertLayoutIndex);

            // Remove the dragged element from the source layout
            const updatedElements = currentLayout.elements.filter(e => e.id !== draggedElement.id);

            // Check if we need to add a new empty editor to the source cell
            if (elementsInSameCell.length === 0) {
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

                updatedElements.push(newEditorElement);
            }

            // Update the source layout
            updateLayout(presentationId, slide.id, currentLayout.id, {
                elements: updatedElements
            });
        }

        // Reset drag states
        resetDragState();
        updateLayoutDragState({
            dragOverLayout: null,
            dragOverPosition: null
        });
    };

    // Рекурсивная функция для рендеринга макетов и их вложенных элементов
    const renderLayoutContent = (layout: Layout, isFirstLayout: boolean) => {
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

        // Determine layout drag class
        let layoutClassName = styles.layoutContent;
        if (layoutDragState.dragOverLayout === layout.id) {
            if (layoutDragState.dragOverPosition === 'top') {
                layoutClassName += ` ${styles.layoutDragOverTop}`;
            } else if (layoutDragState.dragOverPosition === 'bottom') {
                layoutClassName += ` ${styles.layoutDragOverBottom}`;
            }
        }

        // Render each row and its cells
        return (
            <div
                className={layoutClassName}
                data-layout-id={layout.id}
                onDragOver={(e) => {
                    // Stop propagation to ensure this handler gets priority
                    handleLayoutDragOver(e, layout.id);
                }}
                onDragEnter={(e) => {
                    e.preventDefault();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Only process if we're in a layout drop zone
                    if (layoutDragState.dragOverLayout === layout.id && layoutDragState.dragOverPosition) {
                        handleLayoutDrop();
                    }
                }}
                style={{
                    display: 'grid',
                    gridTemplateAreas,
                    gridTemplateColumns,
                    position: 'relative',
                    marginBottom: '20px', // Add spacing between layouts
                }}
            >
                {/* Top drop zone - an explicit area for dropping above layout */}
                {isFirstLayout && (
                    <div
                        className={styles.layoutDropZone}
                        style={{
                            position: 'absolute',
                            top: '-12px',
                            left: 0,
                            right: 0,
                            height: '24px',
                            zIndex: 5
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (draggedElementId && draggedLayoutId && draggedLayoutId !== layout.id) {
                                updateLayoutDragState({
                                    dragOverLayout: layout.id,
                                    dragOverPosition: 'top'
                                });
                            }
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            // Only clear if we're not entering another valid drop zone
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            if (!relatedTarget || !relatedTarget.closest(`[data-layout-id="${layout.id}"]`)) {
                                updateLayoutDragState({
                                    dragOverLayout: null,
                                    dragOverPosition: null
                                });
                            }
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (draggedElementId && draggedLayoutId) {
                                updateLayoutDragState({
                                    dragOverLayout: layout.id,
                                    dragOverPosition: 'top'
                                });
                                handleLayoutDrop();
                            }
                        }}
                    />
                )}

                {/* Bottom drop zone - an explicit area for dropping below layout */}
                <div
                    className={styles.layoutDropZone}
                    style={{
                        position: 'absolute',
                        bottom: '-12px',
                        left: 0,
                        right: 0,
                        height: '24px',
                        zIndex: 5
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedElementId && draggedLayoutId && draggedLayoutId !== layout.id) {
                            updateLayoutDragState({
                                dragOverLayout: layout.id,
                                dragOverPosition: 'bottom'
                            });
                        }
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        // Only clear if we're not entering another valid drop zone
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget || !relatedTarget.closest(`[data-layout-id="${layout.id}"]`)) {
                            updateLayoutDragState({
                                dragOverLayout: null,
                                dragOverPosition: null
                            });
                        }
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedElementId && draggedLayoutId) {
                            updateLayoutDragState({
                                dragOverLayout: layout.id,
                                dragOverPosition: 'bottom'
                            });
                            handleLayoutDrop();
                        }
                    }}
                />

                {/* Top drop indicator */}
                {layoutDragState.dragOverLayout === layout.id && layoutDragState.dragOverPosition === 'top' && (
                    <div
                        className={styles.layoutDropIndicator}
                        style={{
                            position: 'absolute',
                            top: '-6px',
                            left: 0,
                            right: 0,
                            height: '2px',
                            backgroundColor: '#3b82f6',
                            zIndex: 10
                        }}
                    />
                )}

                {/* Bottom drop indicator */}
                {layoutDragState.dragOverLayout === layout.id && layoutDragState.dragOverPosition === 'bottom' && (
                    <div
                        className={styles.layoutDropIndicator}
                        style={{
                            position: 'absolute',
                            bottom: '-6px',
                            left: 0,
                            right: 0,
                            height: 'px',
                            backgroundColor: '#3b82f6',
                            zIndex: 10
                        }}
                    />
                )}

                {layout.gridStructure.rows.map((row: GridRow) => (
                    <React.Fragment key={row.id}>
                        {row.cells.map((cell: GridCell, cellIndex: number) => {
                            const cellId = cell.id;
                            const elements = cellElements[cellId] || [];
                            const isLastCell = cellIndex === row.cells.length - 1;
                            // const hasMultipleCells = row.cells.length > 1;

                            return (
                                <GridCellElement
                                    key={cellId}
                                    slideEditorRef={editorRef}
                                    tiptapRefs={tiptapRefs}
                                    cell={cell}
                                    elements={elements}
                                    dragOverElement={dndState.dragOverElement}
                                    dragOverPosition={dndState.dragOverPosition}
                                    presentationId={presentationId}
                                    slideId={slide.id}
                                    layoutId={layout.id}
                                    index={cellIndex}
                                    hasMultipleCells={hasMultipleCellsInRow}
                                    isLastCell={isLastCell}
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

        // Check if we're currently in the middle of a layout-level drag operation
        if (draggedElementId && draggedLayoutId && layoutDragState.dragOverLayout && layoutDragState.dragOverPosition) {
            handleLayoutDrop();
            return;
        }

        // Process regular element drop if there's drag data
        if (e.dataTransfer.types.includes('application/json')) {
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data.elementId && data.layoutId) {
                    setDraggedElementId(data.elementId);
                    setDraggedLayoutId(data.layoutId);

                    // We need to dispatch this to be handled by the appropriate handler based on current state
                    const event = e.nativeEvent;
                    document.dispatchEvent(new DragEvent('drop', event));
                }
            } catch (error) {
                console.error('Error parsing drag data:', error);
            }
        }

        // Reset drag states
        resetDragState();
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
                    onDragOver={(e) => {
                        e.preventDefault();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(e);
                    }}
                >
                    {/* Контейнер для содержимого */}
                    <div className="relative w-full h-full p-8 mt-10">
                        {slide.layouts.map((layout, index) => renderLayoutContent(layout, index === 0))}
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
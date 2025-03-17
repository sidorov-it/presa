import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { useEditorStore } from '@/store/editorStore';
import { getPredefinedGridStructures, GridCell, GridStructure, Layout, Element as SlideElement } from '@/types';
import { GridListElement, GridImageElement, GridTextElement } from '@/types/grid-elements';
import Tiptap, { TiptapRef } from '@/components/tiptap/Tiptap';
import styles from './GridCellElement.module.css';
import { generateId } from '@/utils/id';

// Create a global registry to store editor refs
// This allows us to access any editor by its ID
// const editorRefs: Record<string, React.RefObject<TiptapRef>> = {};

const adjustColumnWidths = (
    columnWidths: string[],
    currentColumnIndex: number,
    newWidthPart: number,
    isLastCell: boolean,
    totalColumns: number
): string[] => {
    // Create a new array to avoid modifying the original
    const newColumnWidths = [...columnWidths];

    // Parse all column widths to get their percentage values
    const percentValues = columnWidths.map(width => {
        const match = width.match(/^([\d.]+)%$/);
        // If the width is in fr format, convert to an equal percentage
        const frMatch = width.match(/^([\d.]+)fr$/);
        if (match) {
            return parseFloat(match[1]);
        } else if (frMatch) {
            // Convert fr to percentage (equally distributed)
            return 100 / totalColumns;
        } else {
            return 100 / totalColumns;
        }
    });

    // Calculate the new width for the current column (clamped between 15% and 85%)
    const newWidthPercentage = Math.max(15, Math.min(85, newWidthPart * 100));

    // Calculate the difference between the old and new width
    const difference = percentValues[currentColumnIndex] - newWidthPercentage;

    // If there's no change, return the original widths
    if (Math.abs(difference) < 0.01) {
        return columnWidths;
    }

    // Set the width of the current column
    newColumnWidths[currentColumnIndex] = `${newWidthPercentage.toFixed(2)}%`;

    // Determine which neighboring cell to adjust
    let neighborIndex: number;

    if (!isLastCell && currentColumnIndex < totalColumns - 1) {
        // If not the last cell, adjust the next column
        neighborIndex = currentColumnIndex + 1;
    } else if (currentColumnIndex > 0) {
        // If this is the last column, adjust the previous column
        neighborIndex = currentColumnIndex - 1;
    } else {
        // Single column case - just set the current column
        return newColumnWidths;
    }

    // Calculate the new width for the neighboring cell
    let neighborNewWidth = percentValues[neighborIndex] + difference;

    // Ensure the minimum width of 15% is maintained for the neighbor
    if (neighborNewWidth < 15) {
        // If the neighbor would be too small, cap it at 15%
        neighborNewWidth = 15;

        // Recalculate the current cell's width to ensure total is 100%
        const totalOtherCellsWidth = percentValues.reduce((sum, width, index) => {
            if (index !== currentColumnIndex && index !== neighborIndex) {
                return sum + width;
            }
            return sum;
        }, 0);

        const maxCurrentCellWidth = 100 - totalOtherCellsWidth - 15; // 15% for neighbor
        newColumnWidths[currentColumnIndex] = `${Math.min(newWidthPercentage, maxCurrentCellWidth).toFixed(2)}%`;
    } else {
        // Set the neighbor's width
        newColumnWidths[neighborIndex] = `${neighborNewWidth.toFixed(2)}%`;
    }

    // Ensure the total is exactly 100%
    const totalPercentage = newColumnWidths.reduce((sum, width) => {
        const match = width.match(/^([\d.]+)%$/);
        return sum + (match ? parseFloat(match[1]) : 0);
    }, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
        // Adjust the neighbor's width to make the total exactly 100%
        const currentNeighborWidth = parseFloat(newColumnWidths[neighborIndex]);
        const adjustment = 100 - totalPercentage;
        const adjustedNeighborWidth = Math.max(15, currentNeighborWidth + adjustment);
        newColumnWidths[neighborIndex] = `${adjustedNeighborWidth.toFixed(2)}%`;
    }

    return newColumnWidths;
};

// Компонент для отображения элемента в ячейке сетки
const GridCellElement: React.FC<{
    elements: SlideElement[];
    presentationId: string;
    slideId: string;
    layoutId: string;
    index?: number;
    hasMultipleCells?: boolean;
    isLastCell?: boolean;
    slideEditorRef: React.RefObject<HTMLDivElement>;
    dataElementKey?: string;
    tiptapRefs: React.RefObject<Record<string, React.RefObject<TiptapRef>>>;
    onSelect: (element: SlideElement) => void;
    onDelete: (element: SlideElement) => void;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string, position: 'top' | 'bottom' | 'left' | 'right') => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string, position: 'top' | 'bottom' | 'left' | 'right') => void;
    onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({
    elements,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    // isSelected,
    index,
    onSelect,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    onDragLeave,
    hasMultipleCells = false,
    isLastCell = false,
    slideEditorRef,
    dataElementKey
}) => {
        const { updateElement, updateLayout, addElement } = usePresentationStore();
        const { elementToFocus, clearElementToFocus } = useEditorStore();
        const dragHandleRef = useRef<HTMLDivElement>(null);
        const [isDragging, setIsDragging] = useState(false);
        const editorRef = useRef<HTMLDivElement>(null);
        const resizeBorderRef = useRef<HTMLDivElement>(null);
        const [isResizing, setIsResizing] = useState(false);
        const [startX, setStartX] = useState(0);
        const [startWidth, setStartWidth] = useState(0);

        // Create a map of element IDs to their Tiptap refs
        // const tiptapRefs = useRef<Record<string, React.RefObject<TiptapRef>>>({});

        // Initialize refs for each element
        useEffect(() => {
            // Create refs for each element if they don't exist
            elements.forEach(element => {
                if (tiptapRefs.current && !tiptapRefs.current[element.id]) {
                    tiptapRefs.current[element.id] = React.createRef<TiptapRef>();
                }
            });

            // Register all editor refs in the global registry
            // elements.forEach(element => {
            //     const editorId = `${layoutId}-${element.id}`;
            //     editorRefs[editorId] = tiptapRefs.current[element.id];
            // });

            return () => {
                // Clean up when unmounted
                // elements.forEach(element => {
                //     const editorId = `${layoutId}-${element.id}`;
                //     delete editorRefs[editorId];
                // });
            };
        }, [layoutId, elements]);


        // Effect to check if any element should be focused
        useEffect(() => {
            if (elementToFocus) {
                // Find the element that should be focused
                const elementToFocusInCell = elements.find(
                    el => el.id === elementToFocus.elementId &&
                        layoutId === elementToFocus.layoutId &&
                        el.cellId === elementToFocus.cellId
                );

                if (elementToFocusInCell) {
                    // Clear the focus target immediately to prevent multiple focus attempts
                    clearElementToFocus();

                    // Select this element
                    onSelect(elementToFocusInCell);

                    // Use requestAnimationFrame to focus as soon as the browser is ready to paint
                    requestAnimationFrame(() => {
                        // Focus using the ref
                        const ref = tiptapRefs.current?.[elementToFocusInCell.id];
                        if (ref && ref.current) {
                            ref.current.focus();
                        }
                    });
                }
            }
        }, [elements, layoutId, elementToFocus, clearElementToFocus, onSelect]);

        // Обработчик для изменения содержимого редактора
        const handleEditorContentChange = (elementId: string) => (content: string) => {
            updateElement(presentationId, slideId, layoutId, elementId, {
                content: content
            } as Partial<SlideElement>);
        };

        // Обработчик для добавления нового редактора при нажатии Enter
        const handleEnterPressed = (element: SlideElement) => () => {
            // Получаем текущий макет
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return;

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return;

            const layout = slide.layouts.find(l => l.id === layoutId);
            if (!layout) return;

            const row = layout.gridStructure.rows.find(r => r.cells.find(c => c.id === element.cellId));

            // в строке 1 элемент. создаем новую строку
            if (row!.cells.length === 1) {
                // Instead of adding a new row to the grid structure, we'll add a new block layout
                // Create a new layout with a grid that has 1 row and the same number of columns as the current layout
                const newLayoutId = generateId();

                const defaultGridType = 'single-column';

                const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures('single-column');

                const firstNewEditorId = generateId();
                const newElements: SlideElement[] = defaultLayoutGridStructure.rows.map(row => {
                    return row.cells.map(cell => ({
                        id: firstNewEditorId,
                        type: 'editor',
                        textType: 'heading',
                        content: '',
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 100 },
                        style: {},
                        zIndex: 0,
                        cellId: cell.id,
                    } as SlideElement))
                }).flat();

                const newLayout: Layout = {
                    id: newLayoutId,
                    gridStructure: defaultLayoutGridStructure,
                    type: defaultGridType,
                    style: {},
                    elements: newElements,
                }

                // Add the new layout to the slide
                const updatedLayouts = [...slide.layouts];
                const currentLayoutIndex = updatedLayouts.findIndex(l => l.id === layoutId);
                updatedLayouts.splice(currentLayoutIndex + 1, 0, newLayout);

                // Update the slide with the new layouts
                usePresentationStore.getState().updateSlide(presentationId, slideId, {
                    layouts: updatedLayouts
                });

                // Set the element to focus in the editor store
                useEditorStore.getState().setElementToFocus(
                    firstNewEditorId,
                    newLayoutId,
                    newLayout.gridStructure.rows[0].cells[0].id
                );
            } else {
                // в строке больше 1 элемента. просто добавляем новый элемент
                const newElementId = generateId();
                const cell = row?.cells.find(c => c.id === element.cellId);
                if (!cell) return;

                const newElement: SlideElement = {
                    id: newElementId,
                    type: 'editor',
                    textType: 'heading',
                    content: '',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 100 },
                    style: {},
                    zIndex: 0,
                    cellId: cell.id,
                }

                const updatedElements = [...layout.elements];
                updatedElements.push(newElement);

                layout.elements = updatedElements;

                updateLayout(presentationId, slideId, layoutId, layout);
            }
        };

        // Обработчик для удаления пустого редактора при нажатии Backspace
        const handleBackspacePressed = (element: SlideElement) => () => {
            // Если это единственный элемент в макете, не удаляем его
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return;

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return;

            const layout = slide.layouts.find(l => l.id === layoutId);
            if (!layout || layout.elements.length <= 1) return;

            // Удаляем элемент
            usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, element.id);

            // If this is the only element in the layout and there are other layouts, delete the entire layout
            if (layout.elements.length === 1) {
                // Only delete the layout if there's at least one other layout
                if (slide.layouts.length > 1) {
                    usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
                }
            }
        };

        // Получаем содержимое для редактора в зависимости от типа элемента
        const getEditorContent = (element: SlideElement): string => {
            switch (element.type) {
                case 'editor':
                case 'text':
                case 'heading':
                case 'paragraph':
                    // FIXME: этих типов недолжно быть
                    return (element as unknown as GridTextElement).content;
                case 'list':
                    // FIXME: этих типов недолжно быть
                    const listElement = element as unknown as GridListElement;
                    const listType = listElement.listType === 'bullet' ? 'ul' : 'ol';
                    const items = listElement.items.map(item => `<li>${item}</li>`).join('');
                    return `<${listType}>${items}</${listType}>`;
                case 'image':
                    // FIXME: этих типов недолжно быть
                    const imageElement = element as unknown as GridImageElement;
                    return `<img src="${imageElement.src}" alt="${imageElement.alt}" style="max-width: 100%; height: auto;" />`;
                default:
                    return `<p>Неподдерживаемый тип элемента: ${element.type}</p>`;
            }
        };

        // Get the first element for cell styling
        const firstElement = elements[0];

        // Создаем объект стилей
        const cellStyle: React.CSSProperties = {
            ...firstElement?.style
        };

        // Обработчик для начала перетаскивания всей ячейки (используется только когда в ячейке один элемент)
        const handleCellDragStart = (e: React.DragEvent<HTMLDivElement>) => {
            e.stopPropagation();
            setIsDragging(true);

            // Add the dragging class
            if (e.currentTarget.classList) {
                e.currentTarget.classList.add(styles.dragging);
            }

            // Get the first element ID for drag data
            const firstElementId = firstElement?.id;
            if (!firstElementId) return;

            // Set the drag data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', firstElementId);

            // Call the parent's onDragStart handler if provided
            if (onDragStart) {
                onDragStart(e, firstElementId, layoutId);
            }
        };

        // Обработчик для начала перетаскивания отдельного элемента
        const handleElementDragStart = (e: React.DragEvent<HTMLDivElement>, elementId: string) => {
            e.stopPropagation();
            setIsDragging(true);

            // Add the dragging class to the element
            if (e.currentTarget.classList) {
                e.currentTarget.classList.add(styles.dragging);
            }

            // Set the drag data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', elementId);

            // Call the parent's onDragStart handler if provided
            if (onDragStart) {
                onDragStart(e, elementId, layoutId);
            }
        };

        const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
            e.stopPropagation();
            setIsDragging(false);

            // Remove the dragging class
            if (e.currentTarget.classList) {
                e.currentTarget.classList.remove(styles.dragging);
            }
        };

        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            // Set the drop effect
            e.dataTransfer.dropEffect = 'move';

            // Get the first element ID
            const firstElementId = firstElement?.id;
            if (!firstElementId) return;

            // Determine the drop position (top, bottom, left, right)
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element

            // Calculate the position based on which quadrant of the element the cursor is in
            const position = determineDropPosition(x, y, rect.width, rect.height);

            // Call the parent's onDragOver handler if provided
            if (onDragOver) {
                onDragOver(e, firstElementId, layoutId, position);
            }
        };

        // Helper function to determine the drop position
        const determineDropPosition = (x: number, y: number, width: number, height: number): 'top' | 'bottom' | 'left' | 'right' => {
            // Calculate distances from each edge
            const distanceFromTop = y;
            const distanceFromBottom = height - y;
            const distanceFromLeft = x;
            const distanceFromRight = width - x;

            // Find the minimum distance
            const minDistance = Math.min(distanceFromTop, distanceFromBottom, distanceFromLeft, distanceFromRight);

            // Return the position based on the minimum distance
            if (minDistance === distanceFromTop) return 'top';
            if (minDistance === distanceFromBottom) return 'bottom';
            if (minDistance === distanceFromLeft) return 'left';
            if (minDistance === distanceFromRight) return 'right';

            // Default to top if something goes wrong
            return 'top';
        };

        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            // Get the first element ID
            const firstElementId = firstElement?.id;
            if (!firstElementId) return;

            // Determine the drop position
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const position = determineDropPosition(x, y, rect.width, rect.height);

            // Call the parent's onDrop handler if provided
            if (onDrop) {
                onDrop(e, firstElementId, layoutId, position);
            }
        };

        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            // Call the parent's onDragLeave handler if provided
            if (onDragLeave) {
                onDragLeave(e);
            }
        };

        // Handle resize start
        const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            setIsResizing(true);
            const leftBorder = slideEditorRef.current?.getBoundingClientRect().left || 0;
            setStartX(e.clientX - leftBorder);

            // Get the current cell's width
            const cellElement = editorRef.current;
            if (cellElement) {
                const width = cellElement.offsetWidth;
                setStartWidth(width);
            }

            // Add event listeners for resize
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);

            // Add a class to the body to indicate resizing is in progress
            document.body.classList.add('resizing');
        };

        // Handle resize move
        const handleResizeMove = (e: MouseEvent) => {
            // Get the current layout
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return;

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return;

            const layout = slide.layouts.find(l => l.id === layoutId);
            if (!layout || !layout.gridStructure) return;

            // Find the cell in the grid structure
            const cell = layout.gridStructure.rows[0].cells.find(c => c.id === firstElement?.cellId);
            if (!cell) return;

            // Get the slide editor dimensions
            const slideEditorRect = slideEditorRef.current?.getBoundingClientRect();
            if (!slideEditorRect) return;

            // Calculate the total width of the container
            const totalWidth = slideEditorRef.current?.offsetWidth || 1000;

            // Calculate the new width based on mouse position
            const clientX = e.clientX - slideEditorRect.left;
            const deltaX = clientX - startX;
            const newWidth = startWidth + deltaX;

            // Calculate the new width as a percentage of the total width
            let newWidthPercentage = (newWidth / totalWidth) * 100;

            // Get the number of columns in the grid
            const columns = layout.gridStructure.columns;

            // Initialize columnWidths with percentages if they're in fr format or don't exist
            let columnWidths = layout.gridStructure.columnWidths || Array(columns).fill(`${(100 / columns).toFixed(2)}%`);

            // Convert any fr units to percentages if needed
            columnWidths = columnWidths.map(width => {
                if (width.endsWith('fr')) {
                    // Convert fr to percentage based on equal distribution
                    return `${(100 / columns).toFixed(2)}%`;
                }
                return width;
            });

            // Get the current column index (0-based)
            const currentColumnIndex = cell.column - 1;

            // Calculate the maximum allowed width for this cell
            // This ensures we don't exceed 100% total width
            const otherColumnsMinWidth = (columns - 1) * 15; // All other columns at minimum 15%
            const maxAllowedWidth = 100 - otherColumnsMinWidth;

            // Convert to proportion (0-1) for the adjustColumnWidths function
            const newWidthPart = Math.min(maxAllowedWidth, Math.max(15, newWidthPercentage)) / 100;

            // Calculate the new column widths
            const newColumnWidths = adjustColumnWidths(
                columnWidths,
                currentColumnIndex,
                newWidthPart,
                isLastCell,
                columns
            );

            // Update the layout's grid structure with the new column widths
            const updatedGridStructure = {
                ...layout.gridStructure,
                columnWidths: newColumnWidths
            };

            // Update the layout in the store
            updateLayout(presentationId, slideId, layoutId, {
                gridStructure: updatedGridStructure
            });
        };

        // Handle resize end
        const handleResizeEnd = () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);

            // Reset the resizing state
            setIsResizing(false);
        };

        const handleBlur = (element: SlideElement) => {
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return;

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return;

            const layout = slide.layouts.find(l => l.id === layoutId);
            if (!layout) return;

            const lastRow = layout.gridStructure.rows[layout.gridStructure.rows.length - 1];

            if (slide.layouts.length > 1 && lastRow.cells.length === 1 && lastRow.cells[0].id === element.cellId && tiptapRefs.current?.[element.id]?.current?.isEmpty()) {
                usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
            }
        };

        // Add a resize style if resizing is in progress
        const resizeStyle: React.CSSProperties = isResizing ? {
            transition: 'none' // Disable transitions during resize for smoother experience
        } : {};

        return (
            <div
                className={`
                    ${styles.gridCellElement}
                    ${hasMultipleCells ? styles.cellWithBorders : ''}
                    ${isDragging ? styles.dragging : ''}
                    ${isResizing ? styles.resizing : ''}
                    ${hasMultipleCells ? styles.cellWithMultipleCells : ''}
                `}
                onClick={(ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    onSelect(firstElement);
                }}
                style={{
                    ...cellStyle,
                    ...resizeStyle,
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                data-element-id={firstElement?.id}
                data-layout-id={layoutId}
                data-cell-id={firstElement?.cellId}
                data-element-key={dataElementKey}
                data-index={index}
                ref={editorRef}
            >
                <div className={styles.elementsContainer}>
                    {elements.map((element, idx) => (
                        <div key={element.id} className={styles.elementWrapper}>
                            <Tiptap
                                key={element.id}
                                ref={tiptapRefs.current?.[element.id]}
                                id={element.cellId}
                                autoFocus={true}
                                initialContent={getEditorContent(element)}
                                onEnterPressed={handleEnterPressed(element)}
                                onBackspacePressed={handleBackspacePressed(element)}
                                onFocus={() => onSelect(element)}
                                onContentChange={handleEditorContentChange(element.id)}
                                onBlur={() => handleBlur(element)}
                                customBubbleMenuTrigger={dragHandleRef}
                            />

                            {/* Individual element drag handle (visible when cell has multiple elements) */}
                            {elements.length > 1 && (
                                <div
                                    className={styles.elementDragHandle}
                                    draggable
                                    onDragStart={(e) => handleElementDragStart(e, element.id)}
                                    onDragEnd={handleDragEnd}
                                    title="Перетащить элемент"
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Cell drag handle (visible only when cell has a single element) */}
                {elements.length === 1 && (
                    <div
                        ref={dragHandleRef}
                        className={`${styles.dragHandle} ${hasMultipleCells ? styles.dragHandleMultipleCells : ''}`}
                        draggable
                        onDragStart={handleCellDragStart}
                        onDragEnd={handleDragEnd}
                        title="Перетащить ячейку"
                    />
                )}

                {/* Resizable border and indicators for multi-cell layouts */}
                {hasMultipleCells && !isLastCell && (
                    <>
                        <div
                            ref={resizeBorderRef}
                            className={styles.resizableBorder}
                            onMouseDown={handleResizeStart}
                        />
                    </>
                )}
            </div>
        );
    };

export default GridCellElement;
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { useEditorStore } from '@/store/editorStore';
import { getPredefinedGridStructures, GridStructure, Layout, Element as SlideElement } from '@/types';
import { GridListElement, GridImageElement, GridTextElement } from '@/types/grid-elements';
import Tiptap, { TiptapRef } from '@/components/tiptap/Tiptap';
import styles from './GridCellElement.module.css';
import { generateId } from '@/utils/id';

// Create a global registry to store editor refs
// This allows us to access any editor by its ID
const editorRefs: Record<string, React.RefObject<TiptapRef>> = {};

// Simple throttle function to limit the frequency of function calls
const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    let lastResult: any;

    return function (this: any, ...args: any[]) {
        if (!inThrottle) {
            inThrottle = true;
            lastResult = func.apply(this, args);

            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }

        return lastResult;
    };
};

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
    element: SlideElement;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isSelected: boolean;
    index?: number;
    hasMultipleCells?: boolean;
    isLastCell?: boolean;
    slideEditorRef: React.RefObject<HTMLDivElement>;
    dataElementKey?: string;
    onSelect: () => void;
    onDelete: () => void;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string, position: 'top' | 'bottom' | 'left' | 'right') => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string, position: 'top' | 'bottom' | 'left' | 'right') => void;
    onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({
    element,
    presentationId,
    slideId,
    layoutId,
    isSelected,
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
        const { updateElement, updateLayout } = usePresentationStore();
        const { elementToFocus, clearElementToFocus } = useEditorStore();
        const dragHandleRef = useRef<HTMLDivElement>(null);
        const [isDragging, setIsDragging] = useState(false);
        const editorRef = useRef<HTMLDivElement>(null);
        const resizeBorderRef = useRef<HTMLDivElement>(null);
        const [isResizing, setIsResizing] = useState(false);
        const [startX, setStartX] = useState(0);
        const [startWidth, setStartWidth] = useState(0);

        // Create a ref for the Tiptap editor
        const tiptapRef = useRef<TiptapRef>(null);

        // Register this editor ref in the global registry
        useEffect(() => {
            const editorId = `${layoutId}-${element.id}`;
            editorRefs[editorId] = tiptapRef;

            return () => {
                // Clean up when unmounted
                delete editorRefs[editorId];
            };
        }, [layoutId, element.id]);

        // Обработчик для изменения содержимого редактора
        const handleEditorContentChange = (content: string) => {
            updateElement(presentationId, slideId, layoutId, element.id, {
                content: content
            } as Partial<SlideElement>);
        };

        // Обработчик для добавления нового редактора при нажатии Enter
        const handleEnterPressed = () => {
            // Получаем текущий макет
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return;

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return;

            const layout = slide.layouts.find(l => l.id === layoutId);
            if (!layout) return;

            // Instead of adding a new row to the grid structure, we'll add a new block layout
            // Create a new layout with a grid that has 1 row and the same number of columns as the current layout
            const newLayoutId = generateId();
            const cellId = generateId();

            const defaultGridType = 'single-column';

            const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures('single-column');

            const firstNewEditorId = generateId();
            const elements: SlideElement[] = defaultLayoutGridStructure.rows.map(row => {
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
                elements,
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
        };

        // Effect to check if this element should be focused
        useEffect(() => {
            if (
                elementToFocus &&
                element.id === elementToFocus.elementId &&
                layoutId === elementToFocus.layoutId &&
                element.cellId === elementToFocus.cellId
            ) {
                // Clear the focus target immediately to prevent multiple focus attempts
                clearElementToFocus();

                // Select this element
                onSelect();

                // Use requestAnimationFrame to focus as soon as the browser is ready to paint
                // This ensures the focus happens at the earliest possible moment
                requestAnimationFrame(() => {
                    // Focus using the ref
                    if (tiptapRef.current) {
                        tiptapRef.current.focus();
                    }
                });
            }
        }, [element.id, layoutId, element.cellId, elementToFocus, clearElementToFocus, onSelect]);

        // Обработчик для удаления пустого редактора при нажатии Backspace
        const handleBackspacePressed = () => {
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
        const getEditorContent = (): string => {
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

        // Получаем плейсхолдер для редактора
        const getPlaceholder = (): string => {
            return 'Введите / для выбора блока';
        };

        // Создаем объект стилей
        const cellStyle: React.CSSProperties = {
            ...element.style
        };

        // if (element.cellId) {
        //     cellStyle.gridArea = element.cellId;
        // } else {
        //     cellStyle.gridArea = 'auto';
        // }

        // Обработчик для начала перетаскивания
        const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
            e.stopPropagation();
            setIsDragging(true);

            console.log('handleDragStart', element.id);
            // Add the dragging class
            if (e.currentTarget.classList) {
                e.currentTarget.classList.add(styles.dragging);
            }

            // Set the drag data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', element.id);

            // Call the parent's onDragStart handler if provided
            if (onDragStart) {
                console.log('onDragStart', element.id);
                onDragStart(e, element.id, layoutId);
            }
        };

        const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
            e.stopPropagation();
            setIsDragging(false);

            console.log('handleDragEnd', element.id);
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

            // Determine the drop position (top, bottom, left, right)
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element

            // Calculate the position based on which quadrant of the element the cursor is in
            const position = determineDropPosition(x, y, rect.width, rect.height);

            // Call the parent's onDragOver handler if provided
            if (onDragOver) {
                onDragOver(e, element.id, layoutId, position);
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

            // Determine the drop position
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const position = determineDropPosition(x, y, rect.width, rect.height);

            // Call the parent's onDrop handler if provided
            if (onDrop) {
                onDrop(e, element.id, layoutId, position);
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

        // Throttled update function to reduce the number of store updates
        const throttledUpdateLayout = useCallback(
            throttle((gridStructure: any) => {
                updateLayout(presentationId, slideId, layoutId, {
                    gridStructure
                });
            }, 50), // Update at most every 50ms
            [presentationId, slideId, layoutId, updateLayout]
        );

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
                // setCurrentWidth(width);
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
            const cell = layout.gridStructure.rows[0].cells.find(c => c.id === element.cellId);
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
            
            // Parse all column widths to get their percentage values
            const percentValues = columnWidths.map(width => {
                const match = width.match(/^([\d.]+)%$/);
                if (match) {
                    return parseFloat(match[1]);
                }
                return 100 / columns;
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

        const placeholder = isSelected ? getPlaceholder() : '';

        // Add a resize style if resizing is in progress
        const resizeStyle: React.CSSProperties = isResizing ? {
            transition: 'none' // Disable transitions during resize for smoother experience
        } : {};

        return (
            <div
                className={`
                    ${styles.gridCell}
                    ${isSelected ? styles.gridCellSelected : ''}
                    ${isDragging ? styles.dragging : ''}
                    ${hasMultipleCells ? styles.cellWithBorders : ''}
                    ${isResizing ? styles.resizing : ''}
                    ${hasMultipleCells ? styles.cellWithMultipleCells : ''}
                `}
                onClick={onSelect}
                style={{
                    ...cellStyle,
                    ...resizeStyle,
                    gridArea: element.cellId
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                data-element-id={element.id}
                data-layout-id={layoutId}
                data-cell-id={element.cellId}
                data-element-key={dataElementKey}
                data-index={index}
                ref={editorRef}
            >
                <Tiptap
                    ref={tiptapRef}
                    id={element.cellId}
                    initialContent={getEditorContent()}
                    onEnterPressed={handleEnterPressed}
                    onBackspacePressed={handleBackspacePressed}
                    onFocus={onSelect}
                    onContentChange={handleEditorContentChange}
                    autoFocus={isSelected}
                    placeholder={placeholder}
                    customBubbleMenuTrigger={dragHandleRef}
                />

                <div
                    ref={dragHandleRef}
                    className={`${styles.dragHandle} ${hasMultipleCells ? styles.dragHandleMultipleCells : ''}`}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                />

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
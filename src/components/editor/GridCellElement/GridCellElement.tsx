/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { RefObject, useRef, useState } from 'react';
import { GridCell, Element, GridStructure, getPredefinedGridStructures, Layout, TipTapRefs, TextElement } from '@/types';
import { useDnd } from '@/contexts/DragDropContext';
import Tiptap from '@/components/tiptap/Tiptap';
import styles from './GridCellElement.module.css'; // Make sure this exists
import { GridTextElement } from '@/types/grid-elements';
import { usePresentationStore } from '@/store/presentationStore';
import { useHistoryStore } from '@/store/historyStore';
import { generateId } from '@/utils/id';
import { useEditorStore } from '@/store/editorStore';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import { getNewElement } from '@/elements/registry';
import { Editor } from '@tiptap/react';
import { getColumnWidths } from '../SlideEditor/SlideEditor';
import DragHandler from '../DragHandler';
import { PlusIcon } from '@/components/icons';

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

interface GridCellElementProps {
    cell: GridCell;
    elements: Element[];
    dragOverElement: string | null;
    dragOverPosition: 'top' | 'bottom' | 'left' | 'right' | null;
    presentationId: string;
    slideId: string;
    layoutId: string;
    index: number;
    hasMultipleCells: boolean;
    isLayoutHovered: boolean;
    isLayoutSelected: boolean;
    isLastCell: boolean;
    tiptapRefs: RefObject<TipTapRefs>;
    onSelect: (element: Element) => void;
    onDelete: (element: Element) => void;
}

const GridCellElement: React.FC<GridCellElementProps> = ({
    cell,
    elements,
    presentationId,
    slideId,
    layoutId,
    hasMultipleCells,
    isLayoutHovered,
    tiptapRefs,
    onSelect,
    isLastCell
}) => {
    const { handleDragStart } = useDnd();

    const { openMenu, state: { elementId: menuElementId, columnId: menuColumnId } } = useSlideMenu();
    const { setActiveEditor, getActiveEditorId } = useEditorStore();

    const activeEditorId = getActiveEditorId();
    const { beginTransaction, commitTransaction } = useHistoryStore();

    const [elementIsHovered, setElementIsHovered] = useState(false);
    const [cellIsHovered, setCellIsHovered] = useState(false);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const resizeBorderRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef<number | null>(null);

    const resizebleElementRef = useRef<string | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);

    const { updateElement, updateLayout } = usePresentationStore();

    const handleMenuClick = (elementId: string, type: 'element' | 'column' | 'layout' | 'slide', activeEditor?: Editor) => {
        setActiveEditor(activeEditor ?? null)
        openMenu(slideId, elementId, type, layoutId, cell.id, !!activeEditor);
    }

    const getEditorContent = (element: Element): string => {
        switch (element.type) {
            case 'editor':
            case 'text':
            case 'heading':
            case 'paragraph':
                // FIXME: этих типов недолжно быть
                return (element as unknown as GridTextElement).content;
            default:
                return `<p>Неподдерживаемый тип элемента: ${element.type}</p>`;
        }
    };

    const handleBackspacePressed = (element: Element) => {
        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return;

        const slide = presentation.slides.find(s => s.id === slideId);
        if (!slide) return;

        const layout = slide.layouts.find(l => l.id === layoutId);
        if (!layout) return;


        const elementsInCell = layout.elements.filter(e => e.cellId === element.cellId);

        const slideIndex = presentation.slides.findIndex(s => s.id === slideId);
        const layoutIndex = slide.layouts.findIndex(l => l.id === layoutId);

        const isMultiCellRow = layout.gridStructure.rows[0].cells.length > 1;


        if (layoutIndex === 0 && slideIndex === 0 && !isMultiCellRow) {
            // backspace в первой строке первого слайда -> ничего не делаем
            return;
        }

        if (elementsInCell.length === 1 && !isMultiCellRow && layoutIndex === 0 && slide.layouts.length > 1) {
            // склеиваем 2 слайда
            const currentSlideIndex = presentation.slides.findIndex(s => s.id === slideId);
            const previousSlideIndex = currentSlideIndex - 1;

            const previousSlide = presentation.slides[previousSlideIndex];

            if (previousSlide) {
                // берем лэйауты из текущего слайда
                const slideLayouts = [...slide.layouts];
                // удалеяем текущий лэйаут
                slideLayouts.splice(layoutIndex, 1);

                // берем оставшиеся и добавляем в предыдущий слайд
                const previousSlideLayouts = [...previousSlide.layouts, ...slideLayouts];
                beginTransaction(presentationId, 'merge slides');

                const { deleteSlide, updateSlide } = usePresentationStore.getState()
                // удаляем текущий слайд
                deleteSlide(presentationId, slideId);

                updateSlide(presentationId, previousSlide.id, {
                    layouts: previousSlideLayouts
                });
                // usePresentationStore.getState().updateSlide(presentationId, slideId, {
                //     layouts: updatedLayouts
                // });
            } else {
                const updatedLayouts = [...slide.layouts];
                updatedLayouts.splice(layoutIndex, 1);
                usePresentationStore.getState().updateSlide(presentationId, slideId, {
                    layouts: updatedLayouts
                });
            }
        }
        // backspace не в первой строке -> удаляем layout
        else if (elementsInCell.length === 1 && !isMultiCellRow && layoutIndex !== 0 && slide.layouts.length > 1) {
            usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
        }
        // backspace в единственном элементе в ячейке с несколькими ячейками -> удаляем всю ячейку
        else if (isMultiCellRow && elementsInCell.length === 1) {
            const updatedLayout = { ...layout };
            const updatedElements = updatedLayout.elements.filter(e => e.cellId !== element.cellId);
            updatedLayout.elements = updatedElements;

            const updatedCells = updatedLayout.gridStructure.rows[0].cells.filter(c => c.id !== element.cellId)
                .map((cell, index) => ({
                    ...cell,
                    column: index
                }))
                .sort((a, b) => a.column - b.column);

            updatedLayout.gridStructure.rows[0].cells = updatedCells;
            updatedLayout.gridStructure.columns = updatedLayout.gridStructure.columns - 1;
            const updatedColumnWidths = getColumnWidths(updatedLayout.gridStructure.columns);
            updatedLayout.gridStructure.columnWidths = updatedColumnWidths;
            usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
        }
        // backspace в первом элементе в ячейке с несколькими элементами -> удаляем первый элемент. ставим фокус на следующем
        else if (isMultiCellRow && elementsInCell.length >= 1) {
            const updatedLayout = { ...layout };
            const updatedElements = updatedLayout.elements.filter(e => e.id !== element.id);
            updatedLayout.elements = updatedElements;
            usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
        }
        // удаление единственного элемента на слайде. удаляем весь слайд
        else if (elementsInCell.length === 1 && layout.elements.length === 1) {
            usePresentationStore.getState().deleteSlide(presentationId, slideId);
        }
    }

    const handleEnterPressed = (element: Element) => (contentBeforeCursor?: string, contentAfterCursor?: string) => {
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
            const newLayoutId = generateId(8);

            const defaultGridType = 'single-column';

            const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures('single-column');

            const firstNewEditorId = generateId();
            const newElements: Element[] = defaultLayoutGridStructure.rows.map(row => {
                return row.cells.map(cell => ({
                    id: firstNewEditorId,
                    type: 'editor' as const,
                    textType: 'heading' as const,
                    content: contentAfterCursor || '',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 100 },
                    style: {},
                    zIndex: 0,
                    cellId: cell.id,
                }))
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

            updatedLayouts.forEach(layout => {
                layout.elements.forEach(el => {
                    if (el.id === element.id) {
                        return {
                            ...el,
                            content: contentBeforeCursor || ''
                        }
                    }
                    return el;
                })
            })

            // Update the slide with the new layouts
            usePresentationStore.getState().updateSlide(presentationId, slideId, {
                layouts: updatedLayouts
            });

            commitTransaction(presentationId);
            // const updatedCurrentElements = layout.elements.map(el => {
            // if (el.id === element.id) {
            //     return {
            //         ...el,
            //         content: contentBeforeCursor || ''
            //     }
            // }
            // return el;
            // })

            // usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, {
            //     elements: updatedCurrentElements
            // });

            // Set the element to focus in the editor store
            useEditorStore.getState().setElementToFocus(
                firstNewEditorId,
                newLayoutId,
                newLayout.gridStructure.rows[0].cells[0].id
            );

            setTimeout(() => {
                tiptapRefs.current?.editors[firstNewEditorId]?.focus();
            }, 10);

        } else {
            // в строке больше 1 элемента. просто добавляем новый элемент
            const newElementId = generateId();
            const cell = row?.cells.find(c => c.id === element.cellId);
            if (!cell) return;

            const newElementIndex = layout.elements.findIndex(e => e.id === element.id);

            const newElement: Element = {
                id: newElementId,
                type: 'editor' as const,
                textType: 'heading' as const,
                content: contentAfterCursor || '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: {},
                zIndex: 0,
                cellId: cell.id,
            }

            const updatedElements = [...layout.elements];
            updatedElements.splice(newElementIndex + 1, 0, newElement);

            layout.elements = updatedElements;

            updateLayout(presentationId, slideId, layoutId, layout);

            setTimeout(() => {
                tiptapRefs.current?.editors[newElementId]?.focus();
            }, 10)
        }
    };

    const handleEditorContentChange = (elementId: string) => (content: string) => {
        updateElement(presentationId, slideId, layoutId, elementId, {
            content: content
        } as Partial<Element>);
    };

    // Handle resize start
    const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const leftBorder = editorRef.current?.parentElement?.getBoundingClientRect().left || 0;
        const initialX = e.clientX - leftBorder;
        // setStartX(initialX);
        startXRef.current = initialX;

        // Get the current cell's width
        const cellElement = editorRef.current;
        if (cellElement) {
            const width = cellElement.offsetWidth;
            startWidthRef.current = width;
            resizebleElementRef.current = cellElement.getAttribute('data-element-id');
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
        if (!startWidthRef.current) return;
        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return;

        const slide = presentation.slides.find(s => s.id === slideId);
        if (!slide) return;

        const layout = slide.layouts.find(l => l.id === layoutId);
        if (!layout || !layout.gridStructure) return;

        const cell = layout.gridStructure.rows[0].cells.find(c => c.id === resizebleElementRef.current);
        if (!cell) return;

        if (!editorRef.current?.parentElement) {
            return;
        }

        // Get the slide editor dimensions
        const slideEditorRect = editorRef.current.parentElement.getBoundingClientRect();
        if (!slideEditorRect) return;

        // Calculate the total width of the container
        const padding = 16;
        const totalWidth = editorRef.current.parentElement.offsetWidth - padding * 2;

        // Calculate the new width based on mouse position
        const currentX = e.clientX - slideEditorRect.left;
        const deltaX = currentX - startXRef.current;
        const newWidth = Math.max(0, startWidthRef.current + deltaX);

        // Calculate the new width as a percentage of the total width
        const newWidthPercentage = (newWidth / totalWidth) * 100;

        // Get the number of columns in the grid
        const columns = layout.gridStructure.columns;

        // Initialize columnWidths with percentages if they're in fr format or don't exist
        const columnWidths = layout.gridStructure.columnWidths || Array(columns).fill(`${(100 / columns).toFixed(2)}%`);

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
        startWidthRef.current = null;
        resizebleElementRef.current = null;

        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    };

    // Handler for adding new elements via slash command
    const handleAddElement = (type: string, elementId: string) => {
        const elementData = getNewElement(type);
        if (elementData) {
            const newElementWithCell = {
                ...elementData,
                cellId: cell.id,
                id: elementId
            };

            updateElement(presentationId, slideId, layoutId, elementId, newElementWithCell as Partial<Element>);

            tiptapRefs.current?.editors[elementId]?.editor.commands.setContent(elementData.content);
        }
    };

    const handleAddColumn = () => {
        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return;

        const slide = presentation.slides.find(s => s.id === slideId);
        if (!slide) return;

        const layout = slide.layouts.find(l => l.id === layoutId);
        if (!layout) return;

        const updatedLayout = { ...layout };
        const updatedGridStructure = { ...layout.gridStructure };

        const updatedColumnWidths = getColumnWidths(updatedGridStructure.columns);
        updatedGridStructure.columns = updatedGridStructure.columns + 1;
        updatedGridStructure.columnWidths = updatedColumnWidths;

        const newCellId = generateId();

        const newCell: GridCell = {
            id: newCellId,
            column: updatedGridStructure.columns,
            row: 0,
        }

        const newEditor: TextElement = {
            id: generateId(),
            type: 'editor',
            textType: 'text',
            content: '',
            cellId: newCellId,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            style: {},
            zIndex: 0,
        }

        updatedGridStructure.rows[0].cells.push(newCell);
        updatedGridStructure.columnWidths = getColumnWidths(updatedGridStructure.columns);
        updatedLayout.elements.push(newEditor);
        updatedLayout.gridStructure = updatedGridStructure;
        updateLayout(presentationId, slideId, layoutId, updatedLayout);
    }

    // Render your component's elements
    const renderElement = (element: Element) => {
        return (
            <div
                className={`${styles.elementContent} themed-text`}
                data-element-id={element.id}
                onMouseEnter={() => {
                    setElementIsHovered(true)
                }}
                onMouseLeave={() => {
                    setElementIsHovered(false)
                }}
            >
                <div key={element.id} className={`${styles.elementWrapper} themed-block`}>
                    {(menuElementId === element.id || activeEditorId === element.id || elementIsHovered) && (
                        <DragHandler
                            className={styles.elementDragHandle}
                            slideId={slideId}
                            isActive={menuElementId === element.id}
                            data-element-drag-handle={element.id}
                            ariaLabel="Drag this element"
                            handleClick={() => {
                                // Open the SlideMenu for element actions
                                const editor = tiptapRefs.current?.editors[element.id]?.editor;

                                if (element.type === 'editor' && editor) {
                                    if (editor.getText().length > 0) {
                                        setActiveEditor(editor);
                                        editor.chain().focus().selectAll().run();
                                        handleMenuClick(element.id, 'element', editor);
                                    } else {
                                        return;
                                    }
                                }
                                else {
                                    handleMenuClick(element.id, 'element');
                                }
                            }}
                            handleKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleMenuClick(element.id, 'element');
                                    // openMenu(slideId, element.id, 'element');
                                }
                            }}
                            handleDragStart={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, element.id, layoutId, element.cellId);
                            }}
                        />
                    )}

                    <Tiptap
                        key={element.id}
                        elementId={element.id}
                        tiptapRefs={tiptapRefs}
                        id={element.cellId}
                        initialContent={getEditorContent(element)}
                        onEnterPressed={handleEnterPressed(element)}
                        onBackspacePressed={() => handleBackspacePressed(element)}
                        onFocus={() => onSelect(element)}
                        onContentChange={handleEditorContentChange(element.id)}
                        onBlur={() => { }}
                        customBubbleMenuTrigger={dragHandleRef}
                        onAddElement={(type) => handleAddElement(type, element.id)}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                    />
                </div>
            </div>
        );
    };

    const alignmentClassName = cell.alignment === 'top' ? styles.top : cell.alignment === 'center' ? styles.center : cell.alignment === 'bottom' ? styles.bottom : '';

    const className = `${styles.gridCellElement} ${hasMultipleCells ? styles.multiCell : ''} ${hasMultipleCells && !isLayoutHovered ? styles.multiCellNoHover : ''}`;

    return (
        <div
            className={`${className} themed-block`}
            data-element-id={cell.id}
            // data-layout-id={layoutId}
            data-cell-id={cell.id}
            data-cell="true"
            data-is-multi-cell={hasMultipleCells ? "true" : "false"}
            onMouseEnter={() => setCellIsHovered(true)}
            onMouseLeave={() => setCellIsHovered(false)}
            ref={editorRef}
        >
            {/* Drag handle for the entire cell */}
            {(hasMultipleCells && (menuColumnId === cell.id || cellIsHovered)) && (
                <DragHandler
                    slideId={slideId}
                    isActive={menuColumnId === cell.id && !menuElementId}
                    ariaLabel="Drag this cell"
                    className={styles.cellDragHandle}
                    data-column-drag-handle={cell.id}
                    handleClick={() => openMenu(slideId, null, 'column', layoutId, cell.id)}
                    handleKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            openMenu(slideId, null, 'column', layoutId, cell.id);
                        }
                    }}
                    handleDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, '', layoutId, cell.id);
                    }}
                    horizontal={true}
                />
            )}

            <div className={`${styles.gridCell} ${alignmentClassName} themed-block`}>
                <div
                    className={`${styles.elementsContainer} themed-text`}
                    data-is-multi-cell={hasMultipleCells ? "true" : "false"}
                >
                    {elements.map((element, idx) => (
                        <div
                            key={element.id}
                            data-is-first-element={idx === 0 ? "true" : "false"}
                            data-is-last-element={idx === elements.length - 1 ? "true" : "false"}
                        >
                            {renderElement(element)}
                        </div>
                    ))}

                    {/* Resizable border and indicators for multi-cell layouts */}
                </div>
            </div>
            {hasMultipleCells && !isLastCell && (
                <>
                    <div
                        ref={resizeBorderRef}
                        className={styles.resizableBorder}
                        onMouseDown={handleResizeStart}
                    />
                </>
            )}

            {hasMultipleCells && isLastCell && (
                <div
                    className={`${styles.addColumnIcon} themed-button`}
                    onClick={handleAddColumn}
                >
                    <PlusIcon />
                </div>
            )}

            {/* <div>cellId: {cell.id}</div> */}
        </div>
    );
};

export default GridCellElement;
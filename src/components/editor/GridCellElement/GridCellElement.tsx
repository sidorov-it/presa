/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { RefObject, useCallback, useRef, useState, useEffect } from 'react';
import { GridCell, Element, TipTapRefs, ElementConfig } from '@/types';
import { useHandleDragStart } from '@/contexts/DragDropContext';
import styles from './GridCellElement.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';
import { useEditorStore } from '@/store/editorStore';
import { MenuElementType, useSlideMenu } from '@/contexts/SlideMenuContext';
import { Editor } from '@tiptap/react';
import { getColumnWidths } from '../SlideEditor/SlideEditor';
import DragHandler from '../DragHandler';
import { PlusIcon } from '@/components/icons';
import { ElementContent } from '../ElementContent/ElementContent';
import { ComponentStructureType, getNewEditorElement } from '@/elements/registry';
import { useSelectStore } from '@/store/selectStore';

const adjustColumnWidths = (
    columnWidths: string[],
    currentColumnIndex: number,
    newWidthPart: number,
    isLastCell: boolean,
    totalColumns: number
): string[] => {
    const newColumnWidths = [...columnWidths];

    const percentValues = columnWidths.map(width => {
        const match = width.match(/^([\d.]+)%$/);
        const frMatch = width.match(/^([\d.]+)fr$/);
        if (match) {
            return parseFloat(match[1]);
        } else if (frMatch) {
            return 100 / totalColumns;
        } else {
            return 100 / totalColumns;
        }
    });

    const newWidthPercentage = Math.max(15, Math.min(85, newWidthPart * 100));

    const difference = percentValues[currentColumnIndex] - newWidthPercentage;

    if (Math.abs(difference) < 0.01) {
        return columnWidths;
    }

    newColumnWidths[currentColumnIndex] = `${newWidthPercentage.toFixed(2)}%`;

    let neighborIndex: number;

    if (!isLastCell && currentColumnIndex < totalColumns - 1) {
        neighborIndex = currentColumnIndex + 1;
    } else if (currentColumnIndex > 0) {
        neighborIndex = currentColumnIndex - 1;
    } else {
        return newColumnWidths;
    }

    let neighborNewWidth = percentValues[neighborIndex] + difference;

    if (neighborNewWidth < 15) {
        neighborNewWidth = 15;

        const totalOtherCellsWidth = percentValues.reduce((sum, width, index) => {
            if (index !== currentColumnIndex && index !== neighborIndex) {
                return sum + width;
            }
            return sum;
        }, 0);

        const maxCurrentCellWidth = 100 - totalOtherCellsWidth - 15;
        newColumnWidths[currentColumnIndex] = `${Math.min(newWidthPercentage, maxCurrentCellWidth).toFixed(2)}%`;
    } else {
        newColumnWidths[neighborIndex] = `${neighborNewWidth.toFixed(2)}%`;
    }

    const totalPercentage = newColumnWidths.reduce((sum, width) => {
        const match = width.match(/^([\d.]+)%$/);
        return sum + (match ? parseFloat(match[1]) : 0);
    }, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
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
    // isLayoutHovered: boolean;
    isLayoutSelected: boolean;
    isLastCell: boolean;
    slideIsSelected: boolean;
    tiptapRefs: RefObject<TipTapRefs>;
    // onDelete: (element: Element) => void;
    isTable?: boolean;
    rowIndex: number;
    columnIndex: number;
}

const GridCellElement: React.FC<GridCellElementProps> = ({
    cell,
    elements,
    presentationId,
    slideId,
    layoutId,
    hasMultipleCells,
    tiptapRefs,
    isLastCell,
    slideIsSelected,
    isTable = false,
    rowIndex,
    columnIndex
}) => {
    const isHoveredRow = useSelectStore(state => columnIndex === 0 && state.hoveredRowIndex === rowIndex);
    const isHoveredColumn = useSelectStore(state => rowIndex === 0 && state.hoveredColumnIndex === columnIndex);

    const { openMenu, state: { elementId: menuElementId, columnId: menuColumnId, componentStructure: menuComponentStructure } } = useSlideMenu();

    const handleDragStart = useHandleDragStart();

    const [elementIsHovered, setElementIsHovered] = useState(false);
    const [cellIsHovered, setCellIsHovered] = useState(false);

    const [isResizing, setIsResizing] = useState(false);

    const dragHandleRef = useRef<HTMLDivElement>(null);
    const resizeBorderRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef<number | null>(null);

    const resizebleElementRef = useRef<string | null>(null);

    const editorRef = useRef<HTMLDivElement>(null)
    const handleMenuClick = useCallback((menuData: { elementId: string, elementType: MenuElementType, componentStructure?: ComponentStructureType, activeEditor?: Editor }) => {
        useEditorStore.getState().setActiveEditor(menuData.activeEditor ?? null)
        openMenu({
            slideId,
            elementId: menuData.elementId,
            elementType: menuData.elementType,
            layoutId,
            isTextEditor: !!menuData.activeEditor,
            componentStructure: menuData.componentStructure
        });
    }, [slideId, layoutId, cell.id]);

    const animationFrameIdRef = useRef<number | null>(null);

    const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const leftBorder = editorRef.current?.parentElement?.getBoundingClientRect().left || 0;
        const initialX = e.clientX - leftBorder;
        startXRef.current = initialX;

        const cellElement = editorRef.current;
        if (cellElement) {
            const width = cellElement.offsetWidth;
            startWidthRef.current = width;
            resizebleElementRef.current = cellElement.getAttribute('data-element-id');
        }

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);

        setIsResizing(true);
    }, []);

    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }

        animationFrameIdRef.current = requestAnimationFrame(() => {
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

            const slideEditorRect = editorRef.current.parentElement.getBoundingClientRect();
            if (!slideEditorRect) return;

            const padding = 16;
            const totalWidth = editorRef.current.parentElement.offsetWidth - padding * 2;

            const currentX = e.clientX - slideEditorRect.left;
            const deltaX = currentX - startXRef.current;
            const newWidth = Math.max(0, startWidthRef.current + deltaX);

            const newWidthPercentage = (newWidth / totalWidth) * 100;

            const columns = layout.gridStructure.columns;

            const columnWidths = layout.gridStructure.columnWidths || Array(columns).fill(`${(100 / columns).toFixed(2)}%`);

            const currentColumnIndex = cell.column - 1;

            const otherColumnsMinWidth = (columns - 1) * 15; // All other columns at minimum 15%
            const maxAllowedWidth = 100 - otherColumnsMinWidth;

            const newWidthPart = Math.min(maxAllowedWidth, Math.max(15, newWidthPercentage)) / 100;

            const newColumnWidths = adjustColumnWidths(
                columnWidths,
                currentColumnIndex,
                newWidthPart,
                isLastCell,
                columns
            );

            const updatedGridStructure = {
                ...layout.gridStructure,
                columnWidths: newColumnWidths
            };

            usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, {
                gridStructure: updatedGridStructure
            });
        });
    }, [presentationId, isLastCell, slideId, layoutId]);

    const handleResizeEnd = useCallback(() => {
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }

        startWidthRef.current = null;
        resizebleElementRef.current = null;

        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);

        setIsResizing(false);
    }, [handleResizeMove]);

    const handleAddColumn = useCallback(() => {
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

        const newEditor = getNewEditorElement(newCellId);

        updatedGridStructure.rows[0].cells.push(newCell);
        updatedGridStructure.columnWidths = getColumnWidths(updatedGridStructure.columns);
        updatedLayout.elements.push(newEditor);
        updatedLayout.gridStructure = updatedGridStructure;
        usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
    }, [slideId, layoutId, presentationId]);

    const handleClickElementDragHandle = useCallback((element: Element, elementConfig: ElementConfig) => () => {
        const editor = tiptapRefs.current?.editors[element.id]?.editor;

        if (elementConfig.hasTextEditor && editor && elementConfig.componentStructure === ComponentStructureType.TEXT_EDITOR) {
            if (elementConfig.customMenu) {
                editor.chain().focus().run();
            } else if (editor.getText().length > 0) {
                useEditorStore.getState().setActiveEditor(editor);
                editor.chain().focus().selectAll().run();
                handleMenuClick({
                    elementId: element.id,
                    elementType: 'editor',
                    activeEditor: editor
                });
            } else {
                return;
            }
        } else {
            handleMenuClick({
                elementId: element.id,
                elementType: 'element',
                componentStructure: elementConfig.componentStructure
            });
        }
    }, []);

    const handleKeyDownElementDragHandle = useCallback((element: Element, elementConfig: ElementConfig) => (e: any) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClickElementDragHandle(element, elementConfig)(e);
        }
    }, [handleClickElementDragHandle]);

    const handleDragStartElementDragHandle = useCallback((element: Element) => (e: any) => {
        e.stopPropagation();
        handleDragStart(e, element.id, layoutId, element.cellId);
    }, [handleDragStart, layoutId]);

    const alignmentClassName = cell.alignment === 'top' ? styles.top : cell.alignment === 'center' ? styles.center : cell.alignment === 'bottom' ? styles.bottom : '';

    // const className = `${styles.gridCellElement} ${hasMultipleCells ? styles.multiCell : ''} ${hasMultipleCells && !isLayoutHovered ? styles.multiCellNoHover : ''} ${isTable ? styles.tableCell : ''}`;
    const className = `${styles.gridCellElement} ${hasMultipleCells ? styles.multiCell : ''}  ${isTable ? styles.tableCell : ''}`;

    const handleClickCellDragHandle = useCallback(() => {
        openMenu({
            slideId,
            elementId: null,
            elementType: 'cell',
            layoutId,
            columnId: cell.id
        });
    }, [slideId, layoutId, cell.id]);


    const handleKeyDownCellDragHandle = useCallback((e: any) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClickCellDragHandle();
        }
    }, [handleClickCellDragHandle]);


    const handleDragStartCellDragHandle = useCallback((e: any) => {
        e.stopPropagation();
        handleDragStart(e, '', layoutId, cell.id);
    }, [layoutId, cell.id]);

    const handleAddRow = useCallback(() => {
        if (!isTable) return;

        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return;

        const slide = presentation.slides.find(s => s.id === slideId);
        if (!slide) return;

        const layout = slide.layouts.find(l => l.id === layoutId);
        if (!layout || !layout.gridStructure) return;

        const updatedLayout = { ...layout };
        const updatedGridStructure = { ...layout.gridStructure };

        const columns = updatedGridStructure.columns;
        const newCells: GridCell[] = [];
        const newElements: Element[] = [];

        for (let i = 0; i < columns; i++) {
            const newCellId = generateId(8);
            const newCell: GridCell = {
                id: newCellId,
                column: i + 1,
                row: updatedGridStructure.rows.length + 1,
            };

            const newEditor = getNewEditorElement(newCellId);

            newCells.push(newCell);
            newElements.push(newEditor);
        }

        const newRow = {
            id: generateId(8),
            cells: newCells
        };

        updatedGridStructure.rows.push(newRow);
        updatedLayout.gridStructure = updatedGridStructure;
        updatedLayout.elements = [...updatedLayout.elements, ...newElements];

        usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
    }, [isTable, slideId, layoutId, presentationId]);

    // const isLastRow = useCallback(() => {
    //     const presentation = usePresentationStore.getState().getPresentation(presentationId);
    //     if (!presentation) return false;

    //     const slide = presentation.slides.find(s => s.id === slideId);
    //     if (!slide) return false;

    //     const layout = slide.layouts.find(l => l.id === layoutId);
    //     if (!layout || !layout.gridStructure) return false;

    //     const rowIndex = layout.gridStructure.rows.findIndex(row =>
    //         row.cells.some(c => c.id === cell.id)
    //     );

    //     return rowIndex === layout.gridStructure.rows.length - 1;
    // }, [presentationId, slideId, layoutId, cell.id]);

    // const [lastRowCell, setLastRowCell] = useState(false);

    // useEffect(() => {
    //     if (isTable) {
    //         setLastRowCell(isLastRow());
    //     }
    // }, [isTable, isLastRow]);

    const handleOpenColumnMenu = useCallback(() => {
        openMenu({
            slideId,
            elementId: null,
            layoutId,
            elementType: 'column',
            columnId: cell.id,
            tableRowIndex: rowIndex,
            tableColumnIndex: columnIndex,
            tableId: layoutId
        });
    }, [slideId, layoutId, cell.id, rowIndex, columnIndex]);

    const handleOpenRowMenu = useCallback(() => {
        openMenu({
            slideId,
            elementId: null,
            layoutId,
            elementType: 'row',
            tableRowIndex: rowIndex,
            tableColumnIndex: columnIndex,
            tableId: layoutId
        });
    }, [slideId, layoutId, cell.id, rowIndex, columnIndex]);

    return (
        <div
            className={`${className}`}
            data-cell-id={cell.id}
            data-cell="true"
            data-is-multi-cell={hasMultipleCells ? "true" : "false"}
            data-is-table={isTable ? "true" : "false"}
            onMouseEnter={(el) => {
                // console.log(el.target)
                if (isTable) {
                    useSelectStore.getState().hoverColumnIndex(layoutId, columnIndex);
                    useSelectStore.getState().hoverRowIndex(layoutId, rowIndex);
                }
                setCellIsHovered(true)
            }}
            onMouseLeave={() => {
                setCellIsHovered(false)
            }
            }
            ref={editorRef}
        >
            {!isTable && (hasMultipleCells && (menuColumnId === cell.id || cellIsHovered)) && (
                <DragHandler
                    slideId={slideId}
                    isActive={menuColumnId === cell.id && !menuElementId}
                    ariaLabel="Drag this cell"
                    className={styles.cellDragHandle}
                    dataAttributes={{
                        'data-column-drag-handle': cell.id,
                    }}
                    handleClick={handleClickCellDragHandle}
                    handleKeyDown={handleKeyDownCellDragHandle}
                    handleDragStart={handleDragStartCellDragHandle}
                    horizontal={true}
                />
            )}

            <div className={`${styles.gridCell} ${alignmentClassName}`}>
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
                            <ElementContent
                                element={element}
                                setElementIsHovered={setElementIsHovered}
                                menuElementId={menuElementId}
                                elementIsHovered={elementIsHovered}
                                handleClickElementDragHandle={handleClickElementDragHandle}
                                handleKeyDownElementDragHandle={handleKeyDownElementDragHandle}
                                handleDragStartElementDragHandle={handleDragStartElementDragHandle}
                                slideId={slideId}
                                tiptapRefs={tiptapRefs}
                                dragHandleRef={dragHandleRef}
                                presentationId={presentationId}
                                layoutId={layoutId}
                                isInTable={isTable}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {hasMultipleCells && !isLastCell && (
                <>
                    <div
                        ref={resizeBorderRef}
                        className={`${styles.resizableBorder} ${isResizing ? styles.resizableBorderDragged : ''}`}
                        onMouseDown={handleResizeStart}
                    />
                </>
            )}

            {!isTable && hasMultipleCells && isLastCell && elementIsHovered && !slideIsSelected && (
                <div
                    className={`${styles.addColumnIcon} themed-button`}
                    onClick={handleAddColumn}
                >
                    <PlusIcon />
                </div>
            )}


            {isTable && isHoveredRow && (
                <DragHandler
                    className={styles.tableRowDragHandle}
                    slideId={slideId}
                    isActive={false}
                    ariaLabel="Drag this row"
                    // dataAttributes={{ 'data-row-drag-handle': row.id }}
                    handleClick={handleOpenRowMenu}
                    handleKeyDown={() => { }}
                    handleDragStart={() => { }}
                />
            )}
            {isTable && isHoveredColumn && (
                <DragHandler
                    className={styles.columnDragHandle}
                    slideId={slideId}
                    isActive={false}
                    ariaLabel="Drag this row"
                    handleClick={handleOpenColumnMenu}
                    handleKeyDown={() => { }}
                    handleDragStart={() => { }}
                />
            )}

            {/* {isTable && lastRowCell && isLastCell && elementIsHovered && !slideIsSelected && (
                <div
                    className={`${styles.addRowIcon} themed-button`}
                    onClick={handleAddRow}
                >
                    <PlusIcon />
                </div>
            )} */}
        </div>
    );
};

GridCellElement.displayName = 'GridCellElement';

export default GridCellElement;
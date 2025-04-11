/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { RefObject, useCallback, useRef, useState, memo } from 'react';
import { GridCell, Element, TipTapRefs, ElementConfig } from '@/types';
import { useHandleDragStart } from '@/contexts/DragDropContext';
import styles from './GridCellElement.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';
import { useEditorStore } from '@/store/editorStore';
import { MenuElementType } from '@/types';
import { Editor } from '@tiptap/react';
import { getColumnWidths } from '../SlideEditor/SlideEditor';
import DragHandler from '../DragHandler';
import { PlusIcon } from '@/components/icons';
import { ElementContent } from '../ElementContent/ElementContent';
import { ComponentStructureType, getNewEditorElement } from '@/elements/registry';
import { useMenuStore } from '@/store/menuStore';
import { useShallow } from 'zustand/react/shallow';

export const useIsSelectedRow = (tableId: string, rowIndex: number) =>
    useMenuStore(state => state.tableRowIndex === rowIndex && state.tableId === tableId);

export const useIsSelectedColumn = (tableId: string, columnIndex: number) =>
    useMenuStore(state => {
        return state.tableColumnIndex === columnIndex && state.tableId === tableId
    });

export const useIsHoveredRow = (tableId: string, rowIndex: number, columnIndex: number) =>
    useMenuStore(state => columnIndex === 0 && state.hoveredRowIndex === rowIndex && state.hoveredTableId === tableId);

export const useIsHoveredColumn = (tableId: string, rowIndex: number, columnIndex: number) =>
    useMenuStore(state => rowIndex === 0 && state.hoveredColumnIndex === columnIndex && state.hoveredTableId === tableId);

export const useMenuElementId = () => useMenuStore(state => state.elementId);


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
    // elements: Element[];
    presentationId: string;
    slideId: string;
    layoutId: string;
    index: number;
    hasMultipleCells: boolean;
    isLayoutSelected: boolean;
    // isLastCell: boolean;
    slideIsSelected: boolean;
    tiptapRefs: RefObject<TipTapRefs>;
    isTable?: boolean;
    rowIndex: number;
    columnIndex: number;
}

const GridCellElement: React.FC<GridCellElementProps> = ({
    cell,
    // elements,
    presentationId,
    slideId,
    layoutId,
    hasMultipleCells,
    tiptapRefs,
    // isLastCell,
    slideIsSelected,
    isTable = false,
    rowIndex,
    columnIndex
}) => {
    const isSelectedColumn = useIsSelectedColumn(layoutId, columnIndex);
    const isHoveredColumn = useIsHoveredColumn(layoutId, rowIndex, columnIndex);
    const isMenuCurrentColumn = useMenuStore(state => {
        return state.tableColumnIndex === columnIndex && state.selectedTableId === layoutId
    });

    const hasSelectedColumn = useMenuStore(state => !!state.tableColumnIndex && state.selectedTableId === layoutId);
    const hasSelectedRow = useMenuStore(state => !!state.tableRowIndex && state.selectedTableId === layoutId);

    const elementsIds = usePresentationStore(
        useShallow(state => state.presentations
            .find(p => p.id === presentationId)
            ?.slides.find(s => s.id === slideId)
            ?.layouts.find(l => l.id === layoutId)
            ?.elements.filter(e => e.cellId === cell.id)
            .map(e => e.id) ?? []
    ));        // const elements = usePresentationStore(state => state.getElements(presentationId, slideId, layoutId, elementsIds));
    // const elements = usePresentationStore.getState().getCellElements(presentationId, slideId, layoutId, cell.id);
    const isLastCell = elementsIds[elementsIds.length - 1] === cell.id;

    const menuElementId = useMenuStore(state => state.elementId);
    const isHoveredRow = useIsHoveredRow(layoutId, rowIndex, columnIndex);
    const isSelectedRow = useIsSelectedRow(layoutId, rowIndex);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const resizeBorderRef = useRef<HTMLDivElement>(null);

    const [isResizing, setIsResizing] = useState(false);

    const handleDragStart = useHandleDragStart();

    const [elementIsHovered, setElementIsHovered] = useState(false);
    const [cellIsHovered, setCellIsHovered] = useState(false);

    const startXRef = useRef(0);
    const startWidthRef = useRef<number | null>(null);

    const resizebleElementRef = useRef<string | null>(null);

    const editorRef = useRef<HTMLDivElement>(null)
    const handleMenuClick = useCallback((menuData: { elementId: string, elementType: MenuElementType, componentStructure?: ComponentStructureType, activeEditor?: Editor }) => {
        useEditorStore.getState().setActiveEditor(menuData.activeEditor ?? null)
        useMenuStore.getState().openMenu({
            slideId,
            elementId: menuData.elementId,
            elementType: menuData.elementType,
            layoutId,
            isTextEditor: !!menuData.activeEditor,
            componentStructure: menuData.componentStructure
        });
    }, [slideId, layoutId]);

    const animationFrameIdRef = useRef<number | null>(null);

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

            const otherColumnsMinWidth = (columns - 1) * 15;
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
    }, [handleResizeEnd, handleResizeMove]);


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
    }, [handleMenuClick]);

    const handleKeyDownElementDragHandle = useCallback((element: Element, elementConfig: ElementConfig) => (e: any) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClickElementDragHandle(element, elementConfig)();
        }
    }, [handleClickElementDragHandle]);

    const handleDragStartElementDragHandle = useCallback((element: Element) => (e: any) => {
        e.stopPropagation();
        handleDragStart(e, element.id, layoutId, element.cellId);
    }, [handleDragStart, layoutId]);

    const alignmentClassName = cell.alignment === 'top' ? styles.top : cell.alignment === 'center' ? styles.center : cell.alignment === 'bottom' ? styles.bottom : '';

    const className = `${styles.gridCellElement} ${hasMultipleCells ? styles.multiCell : ''}  ${isTable ? styles.tableCell : ''}`;

    const handleClickCellDragHandle = useCallback(() => {
        useMenuStore.getState().openMenu({
            slideId,
            elementId: null,
            elementType: 'cell',
            layoutId,
            cellId: cell.id,
            tableColumnIndex: columnIndex,
            tableRowIndex: rowIndex,
            tableId: layoutId
        });
    }, [slideId, layoutId, cell.id, columnIndex, rowIndex]);


    const handleKeyDownCellDragHandle = useCallback((e: any) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClickCellDragHandle();
        }
    }, [handleClickCellDragHandle]);


    const handleDragStartCellDragHandle = useCallback((e: any) => {
        e.stopPropagation();
        handleDragStart(e, '', layoutId, cell.id);
    }, [handleDragStart, layoutId, cell.id]);

    const handleOpenColumnMenu = useCallback(() => {
        useMenuStore.getState().openMenu({
            slideId,
            elementId: null,
            layoutId,
            elementType: 'column',
            cellId: null,
            tableRowIndex: null,
            tableColumnIndex: columnIndex,
            tableId: layoutId
        });
    }, [slideId, layoutId, columnIndex]);

    const handleOpenRowMenu = useCallback(() => {
        useMenuStore.getState().openMenu({
            slideId,
            elementId: null,
            layoutId,
            elementType: 'row',
            tableRowIndex: rowIndex,
            tableColumnIndex: null,
            tableId: layoutId
        });
    }, [slideId, layoutId, rowIndex]);

    const handleClickElement = useCallback((elementId: string) => () => {
        if (tiptapRefs.current?.editors[elementId]?.editor) {
            tiptapRefs.current?.editors[elementId]?.editor.chain().focus().run();
        }
    }, [tiptapRefs]);


    const handleClickGridCell = useCallback((ev: React.MouseEvent<HTMLDivElement>) => {
        ev.stopPropagation();

        if (elementsIds.length === 1) {
            const editor = tiptapRefs.current?.editors[elementsIds[0]]?.editor;
            if (editor) {
                editor.chain().focus().run();
            }
        } else if (ev.target instanceof HTMLElement && ev.target.classList.contains(styles.gridCellElement)) {
            const rect = ev.target?.getBoundingClientRect();

            if (rect) {
                const positionY = ev.clientY - (rect.top ?? 0);
                const slideHeight = rect.height ?? 0;
                const isClickBottom = slideHeight - positionY < 30;
                const isClickTop = positionY < 30;

                if (isClickBottom) {
                    const lastElementId = elementsIds[elementsIds.length - 1];
                    const editor = tiptapRefs.current?.editors[lastElementId]?.editor;
                    if (editor) {
                        editor.chain().focus().run();
                    }
                } else if (isClickTop) {
                    const firstElementId = elementsIds[0];
                    const editor = tiptapRefs.current?.editors[firstElementId]?.editor;
                    if (editor) {
                        editor.chain().focus().run();
                    }
                }
            }
        }
    }, []);

    const deferredIsHoveredRow = isHoveredRow;
    const deferredIsHoveredColumn = isHoveredColumn;

    const isShowRowDragHandler = isTable && ((deferredIsHoveredRow && !isSelectedRow && !hasSelectedRow) || (isSelectedRow && columnIndex === 0));

    const isShowColumnDragHandler = isTable &&
        ((deferredIsHoveredColumn && !isSelectedColumn && !hasSelectedColumn) ||
        (isSelectedColumn && rowIndex === 0));

    return (
        <div
            className={`${className} ${isSelectedRow || isSelectedColumn ? styles.selectedCell : ''}`}
            data-cell-id={cell.id}
            data-cell="true"
            data-is-multi-cell={hasMultipleCells ? "true" : "false"}
            data-is-table={isTable ? "true" : "false"}
            onMouseEnter={() => {
                if (isTable) {
                    useMenuStore.getState().hoverTableCell(layoutId, rowIndex, columnIndex);
                }
                setCellIsHovered(true)
            }}
            onMouseLeave={() => setCellIsHovered(false)}
            onClick={handleClickGridCell}
            ref={editorRef}
        >
            {!isTable && (hasMultipleCells && (isMenuCurrentColumn || cellIsHovered)) && (
                <DragHandler
                    slideId={slideId}
                    isActive={isMenuCurrentColumn && !menuElementId}
                    ariaLabel="Drag this cell"
                    className={styles.cellDragHandle}
                    dataAttributes={{
                        'data-cell-drag-handle': cell.id,
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
                    {elementsIds.map((elementId, idx) => (
                        <div
                            onClick={handleClickElement(elementId)}
                            key={elementId}
                            data-is-first-element={idx === 0 ? "true" : "false"}
                            data-is-last-element={idx === elementsIds.length - 1 ? "true" : "false"}
                        >
                            <ElementContent
                                elementId={elementId}
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

            {isShowRowDragHandler && (
                <DragHandler
                    className={styles.tableRowDragHandle}
                    slideId={slideId}
                    isActive={isSelectedRow}
                    ariaLabel="Drag this row"
                    dataAttributes={{ 'data-row-drag-handle': `${layoutId}-${rowIndex}` }}
                    handleClick={handleOpenRowMenu}
                    handleKeyDown={() => { }}
                    handleDragStart={() => { }}
                />
            )}
            {isShowColumnDragHandler && (
                <DragHandler
                    className={styles.columnDragHandle}
                    slideId={slideId}
                    isActive={isSelectedColumn}
                    ariaLabel="Drag this column"
                    dataAttributes={{ 'data-column-drag-handle': `${layoutId}-${columnIndex}` }}
                    handleClick={handleOpenColumnMenu}
                    handleKeyDown={() => { }}
                    handleDragStart={() => { }}
                />
            )}
        </div>
    );
};

GridCellElement.displayName = 'GridCellElement';

const GridCellElementMemo = memo(GridCellElement, (prevProps, nextProps) => {
    return (
        prevProps.cell.alignment === nextProps.cell.alignment &&
        prevProps.cell.id === nextProps.cell.id &&
        prevProps.slideId === nextProps.slideId &&
        prevProps.layoutId === nextProps.layoutId &&
        // prevProps.isLastCell === nextProps.isLastCell &&
        prevProps.slideIsSelected === nextProps.slideIsSelected &&
        prevProps.rowIndex === nextProps.rowIndex &&
        prevProps.columnIndex === nextProps.columnIndex
    );
});

GridCellElementMemo.displayName = 'GridCellElementMemo';

export default GridCellElement;
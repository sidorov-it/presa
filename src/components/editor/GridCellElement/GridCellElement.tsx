/* eslint-disable indent */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { RefObject, useCallback, useRef, useState, memo, useEffect } from 'react';
import { GridCell, TipTapRefs, ElementConfig } from '@/types';
import { useHandleDragStart } from '@/contexts/DragDropContext';
import styles from './GridCellElement.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import { useEditorStore } from '@/store/editorStore';
import { MenuElementType } from '@/types';
import { Editor } from '@tiptap/react';
import DragHandler from '../DragHandler';
import ElementContent from '../ElementContent/ElementContent';
import { useMenuStore } from '@/store/menuStore';
import { useShallow } from 'zustand/react/shallow';
import adjustWidths from '@/utils/adjustWidths';
import { OpenCustomMenuEvent } from '@/customEvents/OpenCustomMenuEvent';
import { HiPlus } from 'react-icons/hi2';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { getNewEditorElement } from '@/utils/getNewEditorElement';
import { ElementType } from '@/types/elements';

export const useIsSelectedRow = (tableId: string, rowIndex: number) =>
    useMenuStore(state => state.tableRowIndex === rowIndex && state.tableId === tableId);

export const useIsSelectedColumn = (tableId: string, columnIndex: number) =>
    useMenuStore(state => {
        return state.tableColumnIndex === columnIndex && state.tableId === tableId;
    });

export const useIsHoveredRow = (tableId: string, rowIndex: number, columnIndex: number) =>
    useMenuStore(state => columnIndex === 0 && state.hoveredRowIndex === rowIndex && state.hoveredTableId === tableId);

export const useIsHoveredColumn = (tableId: string, rowIndex: number, columnIndex: number) =>
    useMenuStore(
        state => rowIndex === 0 && state.hoveredColumnIndex === columnIndex && state.hoveredTableId === tableId
    );

export const useMenuElementId = () => useMenuStore(state => state.elementId);

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
    isTable = false,
    rowIndex,
    columnIndex,
}) => {
    const isReadOnly = useReadOnly();

    const isSelectedColumn = useIsSelectedColumn(layoutId, columnIndex);
    const isHoveredColumn = useIsHoveredColumn(layoutId, rowIndex, columnIndex);
    const isMenuCurrentColumn = useMenuStore(state => {
        return state.tableColumnIndex === columnIndex && state.selectedTableId === layoutId;
    });

    const hasSelectedColumn = useMenuStore(state => !!state.tableColumnIndex && state.selectedTableId === layoutId);
    const hasSelectedRow = useMenuStore(state => !!state.tableRowIndex && state.selectedTableId === layoutId);

    const elementsIds = usePresentationStore(
        useShallow(
            state =>
                state.presentations
                    .find(p => p.id === presentationId)
                    ?.slides.find(s => s.id === slideId)
                    ?.layouts.find(l => l.id === layoutId)
                    ?.elements.filter(e => e.cellId === cell.id)
                    .map(e => e.id) ?? []
        )
    );

    const isLastCell = usePresentationStore(
        useShallow(state => {
            const layout = state.presentations
                .find(p => p.id === presentationId)
                ?.slides.find(s => s.id === slideId)
                ?.layouts.find(l => l.id === layoutId);

            return layout?.gridStructure.rows[0].cells[layout?.gridStructure.columns - 1]?.id === cell.id;
        })
    );

    // Get resize state from the store
    const {
        isResizing: storeIsResizing,
        columnWidths: storeColumnWidths,
        layoutId: storeLayoutId,
    } = usePresentationStore(state => state.resizeState);

    const menuCellId = useMenuStore(state => state.cellId);

    const isHoveredRow = useIsHoveredRow(layoutId, rowIndex, columnIndex);
    const isSelectedRow = useIsSelectedRow(layoutId, rowIndex);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const resizeBorderRef = useRef<HTMLDivElement>(null);

    const [isResizing, setIsResizing] = useState(false);

    const handleDragStart = useHandleDragStart();

    const layoutIsFocused = useMenuStore(state => state.focusedLayoutId === layoutId);

    // const [elementIsHovered, setElementIsHovered] = useState(false);
    const [cellIsHovered, setCellIsHovered] = useState(false);
    const [layoutIsHovered, setLayoutIsHovered] = useState(false);

    const startXRef = useRef(0);
    const startWidthRef = useRef<number | null>(null);

    const resizebleElementRef = useRef<string | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    const handleMenuClick = useCallback(
        (menuData: { elementId: string; elementType: MenuElementType; activeEditor?: Editor }) => {
            useEditorStore.getState().setActiveEditor(menuData.activeEditor ?? null);
            useMenuStore.getState().openMenu({
                slideId,
                elementId: menuData.elementId,
                elementType: menuData.elementType,
                layoutId,
                isTextEditor: !!menuData.activeEditor,
            });
        },
        [slideId, layoutId]
    );

    const handleResizeMove = useCallback(
        (e: MouseEvent) => {
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

                // Use columnWidths from the store if available, otherwise fallback to layout
                const columnWidths =
                    (storeIsResizing && storeLayoutId === layoutId && storeColumnWidths) ||
                    layout.gridStructure.columnWidths ||
                    Array(columns).fill(`${(100 / columns).toFixed(2)}%`);

                const currentColumnIndex = cell.column - 1;

                const otherColumnsMinWidth = (columns - 1) * 15;
                const maxAllowedWidth = 100 - otherColumnsMinWidth;

                const newWidthPart = Math.min(maxAllowedWidth, Math.max(15, newWidthPercentage)) / 100;

                const newColumnWidths = adjustWidths(
                    columnWidths,
                    currentColumnIndex,
                    newWidthPart,
                    isLastCell,
                    columns
                );

                // Update the temporary column widths in the store
                usePresentationStore.getState().updateTempColumnWidths(newColumnWidths);
            });
        },
        [presentationId, isLastCell, slideId, layoutId, storeIsResizing, storeLayoutId, storeColumnWidths]
    );

    const handleResizeEnd = useCallback(() => {
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }

        // Commit the changes to the real store
        usePresentationStore.getState().endResize(presentationId, slideId, layoutId);

        startWidthRef.current = null;
        resizebleElementRef.current = null;

        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);

        setIsResizing(false);
    }, [handleResizeMove, layoutId, presentationId, slideId]);

    const handleResizeStart = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            const leftBorder = editorRef.current?.parentElement?.getBoundingClientRect().left || 0;
            const initialX = e.clientX - leftBorder;
            startXRef.current = initialX;

            const cellElement = editorRef.current;
            if (cellElement) {
                const width = cellElement.offsetWidth;
                startWidthRef.current = width;
                resizebleElementRef.current = cellElement.getAttribute('data-cell-id');
            }

            // Get the current column widths to store for resizing
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (presentation) {
                const slide = presentation.slides.find(s => s.id === slideId);
                if (slide) {
                    const layout = slide.layouts.find(l => l.id === layoutId);
                    if (layout && layout.gridStructure) {
                        const columns = layout.gridStructure.columns;
                        const originalWidths =
                            layout.gridStructure.columnWidths || Array(columns).fill(`${(100 / columns).toFixed(2)}%`);

                        // Start the resize operation in the store
                        usePresentationStore.getState().startResize(layoutId, originalWidths);
                    }
                }
            }

            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);

            setIsResizing(true);
        },
        [handleResizeEnd, handleResizeMove, layoutId, presentationId, slideId]
    );

    // Restore element drag handlers
    const handleClickElementDragHandle = useCallback(
        (elementId: string, elementConfig: ElementConfig) => () => {
            const editor = tiptapRefs.current?.editors[elementId]?.editor;

            if ('customMenuType' in elementConfig && elementConfig.customMenuType) {
                document.dispatchEvent(
                    new OpenCustomMenuEvent({
                        elementId,
                        elementType: elementConfig.customMenuType as MenuElementType,
                    })
                );
            } else if (elementConfig.hasTextEditor && editor) {
                if (elementConfig.customMenu) {
                    editor.chain().focus().run();
                } else if (editor.getText().length > 0) {
                    useEditorStore.getState().setActiveEditor(editor);
                    editor.chain().focus().selectAll().run();
                    handleMenuClick({
                        elementId,
                        elementType: 'editor',
                        activeEditor: editor,
                    });
                } else {
                    return;
                }
            } else {
                handleMenuClick({
                    elementId,
                    elementType: 'element',
                });
            }
        },
        [handleMenuClick, tiptapRefs]
    );

    const handleKeyDownElementDragHandle = useCallback(
        (elementId: string, elementConfig: ElementConfig) => (e: any) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleClickElementDragHandle(elementId, elementConfig)();
            }
        },
        [handleClickElementDragHandle]
    );

    const handleDragStartElementDragHandle = useCallback(
        (elementId: string) => (e: any) => {
            e.stopPropagation();
            handleDragStart(e, {
                elementId,
                layoutId,
                cellId: cell.id,
                dragElementType: 'element',
            });
        },
        [handleDragStart, layoutId, cell.id]
    );

    // Handle click events on elements
    const handleClickElement = useCallback(
        (elementId: string) => (ev: React.MouseEvent<HTMLDivElement>) => {
            ev.stopPropagation();

            if (isReadOnly) {
                return;
            }

            const target = ev.target as HTMLElement;
            if (tiptapRefs.current?.editors[elementId]?.editor && !target.closest('[data-type="link-editor"]')) {
                tiptapRefs.current?.editors[elementId]?.editor.chain().focus().run();
            }
        },
        [tiptapRefs, isReadOnly]
    );

    // Listen for layout hover events from parent
    useEffect(() => {
        if (isReadOnly) {
            return;
        }

        const handleLayoutHover = (e: CustomEvent<{ layoutId: string; isHovered: boolean }>) => {
            if (e.detail.layoutId === layoutId) {
                setLayoutIsHovered(e.detail.isHovered);
            }
        };

        document.addEventListener('layoutHover', handleLayoutHover as EventListener);
        return () => {
            document.removeEventListener('layoutHover', handleLayoutHover as EventListener);
        };
    }, [layoutId, isReadOnly]);

    let alignmentClassName = '';
    if (cell.alignment === 'top') {
        alignmentClassName = styles.top;
    } else if (cell.alignment === 'center') {
        alignmentClassName = styles.center;
    } else if (cell.alignment === 'bottom') {
        alignmentClassName = styles.bottom;
    }

    const className = `${styles.gridCellElement} ${hasMultipleCells ? styles.multiCell : ''}  ${isTable ? styles.tableCell : ''}`;

    const handleClickCellDragHandle = useCallback(() => {
        useMenuStore.getState().openMenu({
            slideId,
            elementId: null,
            elementType: 'cell',
            layoutId,
            cellId: cell.id,
            tableColumnIndex: null,
            tableRowIndex: null,
            columnIndex: columnIndex,
            tableId: null,
        });
    }, [slideId, layoutId, cell.id, columnIndex]);

    const handleKeyDownCellDragHandle = useCallback(
        (e: any) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleClickCellDragHandle();
            }
        },
        [handleClickCellDragHandle]
    );

    const handleDragStartCellDragHandle = useCallback(
        (e: any) => {
            e.stopPropagation();
            handleDragStart(e, {
                elementId: '',
                layoutId,
                cellId: cell.id,
                dragElementType: 'cell',
            });
        },
        [handleDragStart, layoutId, cell.id]
    );

    const handleOpenColumnMenu = useCallback(() => {
        const layout = usePresentationStore.getState().getLayout(presentationId, slideId, layoutId);
        if (!layout) return;

        if (layout.gridStructure.columns === 1) {
            useMenuStore.getState().openMenu({
                slideId,
                elementId: null,
                layoutId,
                elementType: 'layout',
                cellId: null,
                tableRowIndex: null,
                tableColumnIndex: null,
                tableId: null,
            });
        } else {
            useMenuStore.getState().openMenu({
                slideId,
                elementId: null,
                layoutId,
                elementType: 'column',
                cellId: null,
                tableRowIndex: null,
                tableColumnIndex: columnIndex,
                tableId: layoutId,
            });
        }
    }, [slideId, presentationId, layoutId, columnIndex]);

    const handleOpenRowMenu = useCallback(() => {
        useMenuStore.getState().openMenu({
            slideId,
            elementId: null,
            layoutId,
            elementType: 'row',
            tableRowIndex: rowIndex,
            tableColumnIndex: null,
            tableId: layoutId,
        });
    }, [slideId, layoutId, rowIndex]);

    const handleClickGridCell = useCallback(
        (ev: React.MouseEvent<HTMLDivElement>) => {
            ev.stopPropagation();

            if (isReadOnly) {
                return;
            }

            // If there's only one element and it's a text editor, focus it
            if (elementsIds.length === 1) {
                const element = usePresentationStore
                    .getState()
                    .getElement(presentationId, slideId, layoutId, elementsIds[0].id);

                if (element?.elementTypeId === ElementType.TEXT) {
                    const editor = tiptapRefs.current?.editors[elementsIds[0]]?.editor;
                    if (editor) {
                        editor.chain().focus().run();
                        return;
                    }
                }
            }

            // Get click position relative to the cell
            const cellElement = ev.currentTarget;
            const cellRect = cellElement.getBoundingClientRect();
            const clickY = ev.clientY - cellRect.top;

            const elementNodes = elementsIds
                .map(id => cellElement.querySelector(`[data-element-id="${id}"]`))
                .filter(el => !!el);

            const elementPositions = elementNodes.map((node, index) => {
                const rect = node.getBoundingClientRect();
                return {
                    index,
                    id: elementsIds[index],
                    top: rect.top - cellRect.top,
                    bottom: rect.bottom - cellRect.top,
                    element: usePresentationStore
                        .getState()
                        .getElement(presentationId, slideId, layoutId, elementsIds[index]),
                };
            });

            // Find the closest elements to the click position
            let prevElement = null;
            let nextElement = null;

            for (let i = 0; i < elementPositions.length; i++) {
                const pos = elementPositions[i];
                if (pos.bottom > clickY) {
                    nextElement = pos;
                    prevElement = elementPositions[i - 1] || null;
                    break;
                }
                if (i === elementPositions.length - 1) {
                    prevElement = pos;
                }
            }

            // Check if either of the adjacent elements is a text editor
            const prevIsEditor = prevElement?.element?.elementTypeId === ElementType.TEXT;
            const nextIsEditor = nextElement?.element?.elementTypeId === ElementType.TEXT;

            if (prevIsEditor && prevElement) {
                const element = usePresentationStore
                    .getState()
                    .getElement(presentationId, slideId, layoutId, prevElement.id);

                if (element?.elementTypeId === ElementType.TEXT) {
                    const editor = tiptapRefs.current?.editors[prevElement.id]?.editor;
                    if (editor) {
                        editor.chain().focus('end').run();
                    }
                    return;
                }
            }

            if (nextIsEditor && nextElement) {
                const element = usePresentationStore
                    .getState()
                    .getElement(presentationId, slideId, layoutId, nextElement.id);

                if (element?.elementTypeId === ElementType.TEXT) {
                    const editor = tiptapRefs.current?.editors[nextElement.id]?.editor;
                    if (editor) {
                        editor.chain().focus('end').run();
                    }
                    return;
                }
            }
            const newElement = {
                ...getNewEditorElement('', { tempEditor: true }),
                cellId: cell.id,
            };

            // If no text editor found, create a temporary one
            const layout = usePresentationStore.getState().getLayout(presentationId, slideId, layoutId);

            if (layout) {
                let insertIndex;

                if (nextElement) {
                    insertIndex = layout.elements.findIndex(el => el.id === nextElement.id);
                } else if (prevElement) {
                    insertIndex = layout.elements.findIndex(el => el.id === prevElement.id) + 1;
                } else {
                    insertIndex = elementPositions.length;
                }

                const updatedElements = [...layout.elements];
                updatedElements.splice(insertIndex, 0, newElement);
                usePresentationStore
                    .getState()
                    .updateLayout(presentationId, slideId, layoutId, { elements: updatedElements });

                // Focus the new editor after it's created
                setTimeout(() => {
                    const editor = tiptapRefs.current?.editors[newElement.id]?.editor;
                    if (editor) {
                        editor.chain().focus().run();
                    }
                }, 0);
            }
        },
        [isReadOnly, elementsIds, cell.id, presentationId, slideId, layoutId, tiptapRefs]
    );

    const deferredIsHoveredRow = isHoveredRow;
    const deferredIsHoveredColumn = isHoveredColumn;

    const isShowRowDragHandler =
        isTable &&
        ((deferredIsHoveredRow && !isSelectedRow && !hasSelectedRow) || (isSelectedRow && columnIndex === 0));

    const isShowColumnDragHandler =
        isTable &&
        ((deferredIsHoveredColumn && !isSelectedColumn && !hasSelectedColumn) || (isSelectedColumn && rowIndex === 0));

    const handleAddColumn = useCallback(() => {
        usePresentationStore.getState().addColumnRight(presentationId, slideId, layoutId, columnIndex);
        setCellIsHovered(false);
    }, [presentationId, slideId, layoutId, columnIndex]);

    return (
        <div
            className={`${className} 
                ${isSelectedRow || isSelectedColumn ? styles.selectedCell : ''}
                ${hasMultipleCells && !isTable && (cellIsHovered || layoutIsHovered || layoutIsFocused) ? styles.cellBorderVisible : ''}`}
            data-cell-id={cell.id}
            data-cell="true"
            data-is-multi-cell={hasMultipleCells ? 'true' : 'false'}
            data-is-table={isTable ? 'true' : 'false'}
            onMouseEnter={() => {
                if (isReadOnly) {
                    return;
                }

                if (isTable) {
                    useMenuStore.getState().hoverTableCell(layoutId, rowIndex, columnIndex);
                }
                setCellIsHovered(true);
            }}
            onMouseLeave={() => {
                if (isReadOnly) {
                    return;
                }

                setCellIsHovered(false);
            }}
            onClick={handleClickGridCell}
            ref={editorRef}
        >
            {!isReadOnly &&
                !isTable &&
                hasMultipleCells &&
                (isMenuCurrentColumn || cellIsHovered || menuCellId === cell.id) && (
                    <DragHandler
                        slideId={slideId}
                        isActive={menuCellId === cell.id}
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
                <div className={`${styles.elementsContainer}`} data-is-multi-cell={hasMultipleCells ? 'true' : 'false'}>
                    {elementsIds.map((elementId, idx) => (
                        <div
                            onClick={handleClickElement(elementId)}
                            key={elementId}
                            className={hasMultipleCells ? styles.elementContainer : ''}
                            data-is-first-element={idx === 0 ? 'true' : 'false'}
                            data-is-last-element={idx === elementsIds.length - 1 ? 'true' : 'false'}
                        >
                            <ElementContent
                                elementId={elementId}
                                cellId={cell.id}
                                handleClickElementDragHandle={handleClickElementDragHandle}
                                handleKeyDownElementDragHandle={handleKeyDownElementDragHandle}
                                handleDragStartElementDragHandle={handleDragStartElementDragHandle}
                                slideId={slideId}
                                tiptapRefs={tiptapRefs}
                                dragHandleRef={dragHandleRef}
                                presentationId={presentationId}
                                layoutId={layoutId}
                                isInTable={isTable}
                                hasMultipleCells={hasMultipleCells}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {!isReadOnly && hasMultipleCells && !isTable && !isLastCell && (
                <div
                    ref={resizeBorderRef}
                    className={`${styles.resizableBorder} ${isResizing ? styles.resizableBorderDragged : ''}`}
                    onMouseDown={handleResizeStart}
                />
            )}

            {!isReadOnly && hasMultipleCells && !isTable && isLastCell && (layoutIsFocused || layoutIsHovered) && (
                <button className={styles.addColumnIcon} onClick={handleAddColumn} title="Add column">
                    <HiPlus style={{ width: '1rem', height: '1rem' }} />
                </button>
            )}

            {!isReadOnly && isShowRowDragHandler && (
                <DragHandler
                    className={styles.tableRowDragHandle}
                    slideId={slideId}
                    isActive={isSelectedRow}
                    ariaLabel="Drag this row"
                    dataAttributes={{ 'data-row-drag-handle': `${layoutId}-${rowIndex}` }}
                    handleClick={handleOpenRowMenu}
                    handleKeyDown={() => {}}
                    handleDragStart={e =>
                        handleDragStart(e, {
                            elementId: '',
                            rowIndex: rowIndex,
                            tableId: layoutId,
                            dragElementType: 'table-row',
                        })
                    }
                />
            )}
            {!isReadOnly && isShowColumnDragHandler && (
                <DragHandler
                    className={styles.columnDragHandle}
                    slideId={slideId}
                    isActive={isSelectedColumn}
                    ariaLabel="Drag this column"
                    dataAttributes={{ 'data-column-drag-handle': `${layoutId}-${columnIndex}` }}
                    handleClick={handleOpenColumnMenu}
                    handleKeyDown={() => {}}
                    handleDragStart={e =>
                        handleDragStart(e, {
                            elementId: '',
                            columnIndex: columnIndex,
                            tableId: layoutId,
                            dragElementType: 'table-column',
                        })
                    }
                    title="Drag to reorder column (columns can only be moved within the same table)"
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

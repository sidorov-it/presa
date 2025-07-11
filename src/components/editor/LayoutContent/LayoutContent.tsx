import React, { RefObject, useState, useCallback, useMemo, memo, useRef } from 'react';
import tinycolor from 'tinycolor2';
import { GridRow, GridCell, TipTapRefs } from '@/types';
import { useDnd } from '@/contexts/DragDropContext';
import GridCellElement from '../GridCellElement';
import styles from './LayoutContent.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import DragHandler from '../DragHandler';
import { useSelectedCellId, useSelectedElementId, useSelectedLayoutId, useUIStateStore } from '@/store/uiStateStore';
import { useShallow } from 'zustand/react/shallow';
import adjustWidths from '@/utils/adjustWidths';
import { LayoutHoverEvent } from '@/customEvents/LayoutHoverEvent';
import generateGridTemplateAreas from '@/utils/generateGridTemplateAreas';
import generateGridTemplateColumns from '@/utils/generateGridTemplateColumns';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { useThemeStore } from '@/store/themeStore';

interface LayoutContentProps {
    layoutId: string;
    onDeleteElement: (layoutId: string, elementId: string) => void;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
}

const LayoutContent: React.FC<LayoutContentProps> = ({
    layoutId,
    // onDeleteElement,
    tiptapRefs,
    presentationId,
    slideId,
}) => {
    const [isLayoutHovered, setIsLayoutHovered] = useState(false);
    const [isResizingColumn, setIsResizingColumn] = useState(false);
    const { handleDragStart } = useDnd();

    const layoutRef = useRef<HTMLDivElement>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const startXRef = useRef<number>(0);
    const resizeColumnIndexRef = useRef<number | null>(null);
    const startWidthRef = useRef<number | null>(null);

    const layout = usePresentationStore(useShallow(state => state.getLayout(presentationId, slideId, layoutId)))!;

    // Get resize state from the store for smooth column resizing
    const resizeState = usePresentationStore(useShallow(state => state.resizeState));

    const openMenu = useUIStateStore.getState().openContextMenu;

    const isReadOnly = useReadOnly();

    const selectedLayoutId = useSelectedLayoutId();
    const selectedElementId = useSelectedElementId();
    const selectedCellId = useSelectedCellId();

    const isContextMenuOpen = useUIStateStore(state => state.isContextMenuOpen);
    const themeSlideBackground = useThemeStore(useShallow(state => state.getCurrentThemeSlideBackground()));

    const isTableContentSelected = useUIStateStore(
        state => state.selectedColumnIndex !== null || state.selectedRowIndex !== null
        // state => state.selectedTableColumnIndex !== null || state.selectedTableRowIndex !== null
    );

    // Retrieve slide background color (if any)
    const slideBackground = usePresentationStore(
        useShallow(state => {
            const presentation = state.getPresentation(presentationId);
            if (!presentation) return '#ffffff';

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return '#ffffff';
            return slide?.background?.value;
        })
    );

    // Helper to compute alternating row colors for table layouts
    const rowColors = useMemo(() => {
        if (!layout.isTable) {
            return { evenRowColor: 'transparent', oddRowColor: 'transparent' } as const;
        }

        const bgColor = tinycolor(slideBackground || themeSlideBackground || '#ffffff');
        const isDark = bgColor.isDark();

        if (isDark) {
            // Dark background: make even rows lighter
            return {
                evenRowColor: 'rgba(255, 255, 255, 0.05)',
                oddRowColor: 'transparent',
            } as const;
        }

        // Light background: make even rows slightly darker
        return {
            evenRowColor: 'rgba(0, 0, 0, 0.05)',
            oddRowColor: 'transparent',
        } as const;
    }, [layout.isTable, slideBackground, themeSlideBackground]);

    // Function to get row styles (alternating colors)
    const getRowStyles = useCallback(
        (rowIndex: number): React.CSSProperties => {
            if (!layout.isTable) return {};

            const isEvenRow = rowIndex % 2 === 0;
            return {
                backgroundColor: isEvenRow ? rowColors.evenRowColor : rowColors.oddRowColor,
            };
        },
        [layout.isTable, rowColors]
    );

    const handleMouseEnter = useCallback(() => {
        if (!isLayoutHovered && !isReadOnly) {
            setIsLayoutHovered(true);
            // Dispatch custom event to notify cells
            document.dispatchEvent(
                new LayoutHoverEvent({
                    layoutId: layout.id,
                    isHovered: true,
                })
            );
        }
    }, [isLayoutHovered, layout.id, isReadOnly]);

    const handleMouseLeave = useCallback(() => {
        if (isLayoutHovered && !isReadOnly) {
            setIsLayoutHovered(false);
            // Dispatch custom event to notify cells
            document.dispatchEvent(
                new LayoutHoverEvent({
                    layoutId: layout.id,
                    isHovered: false,
                })
            );
        }
    }, [isLayoutHovered, layout.id, isReadOnly]);

    // Memoize grid properties to prevent recalculations
    const gridTemplateAreas = useMemo(() => generateGridTemplateAreas(layout.gridStructure), [layout.gridStructure]);

    const gridTemplateColumns = useMemo(() => {
        // Use temporary column widths if this layout is being resized
        if (resizeState.isResizing && resizeState.layoutId === layoutId && resizeState.columnWidths) {
            return resizeState.columnWidths.join(' ');
        }
        return generateGridTemplateColumns(layout.gridStructure);
    }, [layout.gridStructure, resizeState, layoutId]);

    // Memoize layout properties
    const hasMultipleCellsInRow = useMemo(
        () => layout.gridStructure.rows.some(row => row.cells.length > 1),
        [layout.gridStructure.rows]
    );

    // Detect if this is a layout with a single element in a single cell
    const isSingleElementSingleCellLayout = useMemo(
        () =>
            layout.elements.length === 1 &&
            layout.gridStructure.rows.length === 1 &&
            layout.gridStructure.rows[0].cells.length === 1,
        [layout.elements.length, layout.gridStructure.rows]
    );

    // console.log('columnDragPosition', columnDragPosition)
    const handleLayoutDragStart = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.stopPropagation();
            handleDragStart(e, {
                elementId: '',
                layoutId: layout.id,
                dragElementType: layout.isTable ? 'table' : 'layout',
            });

            e.dataTransfer.setData(
                'application/json',
                JSON.stringify({
                    type: 'layout',
                    layoutId: layout.id,
                    slideId: slideId,
                })
            );
        },
        [handleDragStart, layout.id, layout.isTable, slideId]
    );

    const handleOpenMenu = useCallback(
        () =>
            openMenu({
                slideId,
                elementId: null,
                elementType: 'layout',
                layoutId: layout.id,
            }),
        [openMenu, slideId, layout.id]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                openMenu({
                    slideId,
                    elementId: null,
                    elementType: 'layout',
                    layoutId: layout.id,
                });
            }
        },
        [openMenu, slideId, layout.id]
    );

    const handleAddColumn = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            usePresentationStore
                .getState()
                .addColumnToTable(presentationId, slideId, layout.id, layout.gridStructure.columns);
        },
        [layout, presentationId, slideId]
    );

    const handleAddRow = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            usePresentationStore
                .getState()
                .addRowToTable(presentationId, slideId, layout.id, layout.gridStructure.rows.length);
        },
        [layout, presentationId, slideId]
    );

    const handleResizeMoveTableColumn = useCallback(
        (e: MouseEvent) => {
            if (animationFrameIdRef.current !== null) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }

            animationFrameIdRef.current = requestAnimationFrame(() => {
                if (!startWidthRef.current || resizeColumnIndexRef.current === null) return;
                const presentation = usePresentationStore.getState().getPresentation(presentationId);
                if (!presentation) return;

                const slide = presentation.slides.find(s => s.id === slideId);
                if (!slide) return;

                const layout = slide.layouts.find(l => l.id === layoutId);
                if (!layout || !layout.gridStructure) return;

                if (!layoutRef.current) {
                    return;
                }

                const layoutRect = layoutRef.current.getBoundingClientRect();
                if (!layoutRect) return;

                const padding = 16; // Same padding as in GridCellElement
                const totalWidth = layoutRef.current.offsetWidth - padding * 2;

                const currentX = e.clientX - layoutRect.left;
                const deltaX = currentX - startXRef.current;
                const newWidth = Math.max(0, startWidthRef.current + deltaX);

                const newWidthPercentage = (newWidth / totalWidth) * 100;

                const columns = layout.gridStructure.columns;

                // Use the current resize state's column widths if available
                const columnWidths =
                    (resizeState.isResizing && resizeState.layoutId === layoutId && resizeState.columnWidths) ||
                    layout.gridStructure.columnWidths ||
                    Array(columns).fill(`${(100 / columns).toFixed(2)}%`);

                const currentColumnIndex = resizeColumnIndexRef.current;
                const isLastColumn = currentColumnIndex === columns - 2; // -2 because we're resizing between columns

                const otherColumnsMinWidth = (columns - 1) * 15;
                const maxAllowedWidth = 100 - otherColumnsMinWidth;

                const newWidthPart = Math.min(maxAllowedWidth, Math.max(15, newWidthPercentage)) / 100;

                const newColumnWidths = adjustWidths(
                    columnWidths,
                    currentColumnIndex,
                    newWidthPart,
                    isLastColumn,
                    columns
                );

                // Update the temporary column widths in the store instead of updating the layout directly
                usePresentationStore.getState().updateTempColumnWidths(newColumnWidths);
            });
        },
        [presentationId, slideId, layoutId, resizeState]
    );

    const handleResizeEndTableColumn = useCallback(() => {
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }

        // Commit the changes to the real store
        usePresentationStore.getState().endResize(presentationId, slideId, layoutId);

        startWidthRef.current = null;
        resizeColumnIndexRef.current = null;

        document.removeEventListener('mousemove', handleResizeMoveTableColumn);
        document.removeEventListener('mouseup', handleResizeEndTableColumn);

        setIsResizingColumn(false);
    }, [handleResizeMoveTableColumn, presentationId, slideId, layoutId]);

    const handleResizeStartTableColumn = useCallback(
        (e: React.MouseEvent<HTMLDivElement>, columnIndex: number) => {
            e.preventDefault();
            e.stopPropagation();

            if (!layoutRef.current) return;

            const leftBorder = layoutRef.current.getBoundingClientRect().left;
            const initialX = e.clientX - leftBorder;
            startXRef.current = initialX;

            const cellElements = layoutRef.current.querySelectorAll('[data-cell="true"]');
            const width = Array.from(cellElements)
                .filter((cell, idx) => idx === columnIndex)
                .reduce((acc, cell) => acc + (cell as HTMLElement).offsetWidth, 0);

            startWidthRef.current = width;
            resizeColumnIndexRef.current = columnIndex;

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

            document.addEventListener('mousemove', handleResizeMoveTableColumn);
            document.addEventListener('mouseup', handleResizeEndTableColumn);

            setIsResizingColumn(true);
        },
        [handleResizeMoveTableColumn, handleResizeEndTableColumn, presentationId, slideId, layoutId]
    );

    const isSelected = selectedLayoutId === layout.id && selectedElementId === null && selectedCellId === null;
    const isFocused = useUIStateStore(state => state.selectedLayoutId === layout.id);

    // const isHovered = isLayoutHovered || isSelected;

    const handleLayoutClick = useCallback(() => {
        if (isReadOnly) {
            return;
        }

        useUIStateStore.getState().setSelectedLayoutId(layout.id);
        document.addEventListener('click', e => {
            if (
                e.target instanceof HTMLElement &&
                !e.target.closest('[data-layout-id]') &&
                !e.target.closest('[data-is-menu="true"]')
            ) {
                useUIStateStore.getState().resetSelectedLayoutId();
            }
        });
    }, [layout.id, isReadOnly]);

    return (
        <>
            <div
                ref={layoutRef}
                className={`${styles.layout}`}
                data-layout-id={layout.id}
                data-is-single-element-layout={isSingleElementSingleCellLayout ? 'true' : 'false'}
                data-is-selected-layout={selectedLayoutId === layout.id ? 'true' : ''}
                role="region"
                aria-label={`Макет ${layout.id}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClickCapture={handleLayoutClick}
            >
                {/* {isSelected && <div className={styles.layoutSelected} />} */}

                {!isReadOnly && layout.elements.length > 1 && (isLayoutHovered || isSelected) && (
                    <DragHandler
                        className={styles.layoutDragHandle}
                        slideId={slideId}
                        isActive={isSelected && isContextMenuOpen && !isTableContentSelected}
                        ariaLabel="Перетащить этот макет"
                        dataAttributes={{
                            'data-layout-drag-handle': layout.id,
                        }}
                        handleClick={handleOpenMenu}
                        handleKeyDown={handleKeyDown}
                        handleDragStart={handleLayoutDragStart}
                    />
                )}
                {layout.gridStructure.rows.map((row: GridRow, rowIndex: number) => {
                    const className = rowIndex % 2 === 0 ? '' : styles.layoutContentEven;
                    return (
                        <div
                            key={row.id}
                            // data-layout-id={layout.id}
                            data-row-id={row.id}
                            className={`${styles.layoutContent} ${layout.isTable ? styles.tableLayoutContent : ''} ${hasMultipleCellsInRow ? styles.multiCellLayout : ''} ${className}`}
                            style={{
                                gridTemplateAreas,
                                gridTemplateColumns,
                                ...getRowStyles(rowIndex),
                            }}
                        >
                            {row.cells.map((cell: GridCell, cellIndex: number) => {
                                // const cellId = cell.id;
                                // const elements = cellElements[cellId] || [];
                                // const isLastCell = cellIndex === row.cells.length - 1;

                                // const elementsIds = elements.map(element => element.id);
                                // const key = `${cellId}-${simpleHash(JSON.stringify(elementsIds))}`;

                                return (
                                    <GridCellElement
                                        key={cell.id}
                                        tiptapRefs={tiptapRefs}
                                        cell={cell}
                                        // elements={elements}
                                        presentationId={presentationId}
                                        slideId={slideId}
                                        layoutId={layout.id}
                                        index={cellIndex}
                                        hasMultipleCells={hasMultipleCellsInRow}
                                        isLayoutSelected={isSelected}
                                        // isLastCell={isLastCell}
                                        slideIsSelected={false}
                                        isTable={layout.isTable}
                                        rowIndex={rowIndex}
                                        columnIndex={cellIndex}
                                    />
                                );
                            })}
                        </div>
                    );
                })}

                {!isReadOnly && layout.isTable && isFocused && (
                    <>
                        <button className={`${styles.addColumnButton} ${styles.tableButton}`} onClick={handleAddColumn}>
                            +
                        </button>
                        <button className={`${styles.addRowButton} ${styles.tableButton}`} onClick={handleAddRow}>
                            +
                        </button>
                    </>
                )}

                {!isReadOnly && layout.isTable && (
                    <>
                        {Array.from({ length: layout.gridStructure.columns }).map((_, index) => {
                            if (index === layout.gridStructure.columns - 1) {
                                return null;
                            }
                            const left = layout.gridStructure.columnWidths.reduce((acc, width, i) => {
                                if (i <= index) {
                                    return acc + parseFloat(width);
                                }
                                return acc;
                            }, 0);

                            return (
                                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                                <div
                                    key={index}
                                    className={`${styles.tableColumnResizeBorder} ${isResizingColumn && resizeColumnIndexRef.current === index ? styles.tableColumnResizeBorderActive : ''}`}
                                    onMouseDown={e => handleResizeStartTableColumn(e, index)}
                                    style={{
                                        left: `calc((100% - var(--grid-padding)) / 100 * ${left})`,
                                    }}
                                />
                            );
                        })}
                    </>
                )}
            </div>
        </>
    );
};

// Force the component to update when the store changes
export default memo(LayoutContent, (prevProps, nextProps) => {
    // Only re-render if layout changes
    return (
        prevProps.layoutId === nextProps.layoutId &&
        prevProps.slideId === nextProps.slideId &&
        prevProps.presentationId === nextProps.presentationId
    );
});

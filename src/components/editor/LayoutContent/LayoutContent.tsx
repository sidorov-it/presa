import React, { RefObject, useState, useCallback, useMemo, memo, useRef } from 'react';
import { GridRow, GridCell, TipTapRefs } from '@/types';
import { useDnd } from '@/contexts/DragDropContext';
import { generateGridTemplateAreas, generateGridTemplateColumns } from '@/types';
import GridCellElement from '../GridCellElement';
import styles from './LayoutContent.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import DragHandler from '../DragHandler';
import { useMenuSelectedCell, useMenuSelectedElement, useMenuSelectedLayout, useMenuStore } from '@/store/menuStore';
import { useShallow } from 'zustand/react/shallow';
import adjustWidths from '@/utils/adjustWidths';
import { LayoutHoverEvent } from '@/customEvents/LayoutHoverEvent';

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
    const { handleDragStart } = useDnd();
    const [isLayoutHovered, setIsLayoutHovered] = useState(false);
    const [isResizingColumn, setIsResizingColumn] = useState(false);

    const layoutRef = useRef<HTMLDivElement>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const startXRef = useRef<number>(0);
    const resizeColumnIndexRef = useRef<number | null>(null);
    const startWidthRef = useRef<number | null>(null);

    const layout = usePresentationStore(useShallow(state => state.getLayout(presentationId, slideId, layoutId)))!;

    // Use optimized selector hooks instead of full context
    const openMenu = useMenuStore.getState().openMenu;

    // Get only the needed state from SlideMenu
    const menuLayoutId = useMenuSelectedLayout();
    const menuElementId = useMenuSelectedElement();
    const menuCellId = useMenuSelectedCell();

    const isTableContentSelected = useMenuStore(
        state => state.tableColumnIndex !== null || state.tableRowIndex !== null
    );

    const handleMouseEnter = useCallback(() => {
        if (!isLayoutHovered) {
            setIsLayoutHovered(true);
            // Dispatch custom event to notify cells
            document.dispatchEvent(
                new LayoutHoverEvent({
                    layoutId: layout.id,
                    isHovered: true,
                })
            );
        }
    }, [isLayoutHovered, layout.id]);

    const handleMouseLeave = useCallback(() => {
        if (isLayoutHovered) {
            setIsLayoutHovered(false);
            // Dispatch custom event to notify cells
            document.dispatchEvent(
                new LayoutHoverEvent({
                    layoutId: layout.id,
                    isHovered: false,
                })
            );
        }
    }, [isLayoutHovered, layout.id]);

    // Memoize grid properties to prevent recalculations
    const gridTemplateAreas = useMemo(() => generateGridTemplateAreas(layout.gridStructure), [layout.gridStructure]);

    const gridTemplateColumns = useMemo(
        () => generateGridTemplateColumns(layout.gridStructure),
        [layout.gridStructure]
    );

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
        [handleDragStart, layout.id, slideId]
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

    const handleAddColumn = useCallback(() => {
        usePresentationStore
            .getState()
            .addColumnToTable(presentationId, slideId, layout.id, layout.gridStructure.columns);
    }, [layout, presentationId, slideId]);

    const handleAddRow = useCallback(() => {
        usePresentationStore
            .getState()
            .addRowToTable(presentationId, slideId, layout.id, layout.gridStructure.rows.length);
    }, [layout, presentationId, slideId]);

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
                const columnWidths =
                    layout.gridStructure.columnWidths || Array(columns).fill(`${(100 / columns).toFixed(2)}%`);

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

                const updatedGridStructure = {
                    ...layout.gridStructure,
                    columnWidths: newColumnWidths,
                };

                usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, {
                    gridStructure: updatedGridStructure,
                });
            });
        },
        [presentationId, slideId, layoutId]
    );

    const handleResizeEndTableColumn = useCallback(() => {
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }

        startWidthRef.current = null;
        resizeColumnIndexRef.current = null;

        document.removeEventListener('mousemove', handleResizeMoveTableColumn);
        document.removeEventListener('mouseup', handleResizeEndTableColumn);

        setIsResizingColumn(false);
    }, [handleResizeMoveTableColumn]);

    const handleResizeStartTableColumn = useCallback(
        (e: React.MouseEvent<HTMLDivElement>, columnIndex: number) => {
            e.preventDefault();
            e.stopPropagation();

            const leftBorder = layoutRef.current?.getBoundingClientRect().left || 0;
            const initialX = e.clientX - leftBorder;
            startXRef.current = initialX;

            // Get the current column width
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return;

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return;

            const layout = slide.layouts.find(l => l.id === layoutId);
            if (!layout || !layout.gridStructure) return;

            const columnWidths =
                layout.gridStructure.columnWidths ||
                Array(layout.gridStructure.columns).fill(`${(100 / layout.gridStructure.columns).toFixed(2)}%`);

            const currentColumnWidth = parseFloat(columnWidths[columnIndex].match(/^([\d.]+)%$/)?.[1] || '0');
            const totalWidth = layoutRef.current?.offsetWidth || 0;
            const padding = 16;
            const columnWidthPx = (totalWidth - padding * 2) * (currentColumnWidth / 100);

            startWidthRef.current = columnWidthPx;
            resizeColumnIndexRef.current = columnIndex;

            document.addEventListener('mousemove', handleResizeMoveTableColumn);
            document.addEventListener('mouseup', handleResizeEndTableColumn);

            setIsResizingColumn(true);
        },
        [handleResizeEndTableColumn, handleResizeMoveTableColumn, presentationId, slideId, layoutId]
    );

    const isSelected = menuLayoutId === layout.id && menuElementId === null && menuCellId === null;

    // const isHovered = isLayoutHovered || isSelected;

    const handleLayoutClick = useCallback(() => {
        useMenuStore.getState().setFocusedLayoutId(layout.id);
        document.addEventListener('click', (e) => {
            if (e.target instanceof HTMLElement && !e.target.closest('[data-layout-id]')) {
                useMenuStore.getState().resetFocusedLayoutId();
            }
        });
    }, [layout.id]);

    return (
        <>
            <div
                ref={layoutRef}
                className={`${styles.layout}`}
                data-layout-id={layout.id}
                data-is-single-element-layout={isSingleElementSingleCellLayout ? 'true' : 'false'}
                role="region"
                aria-label={`Layout ${layout.id}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClickCapture={handleLayoutClick}
            >
                {isSelected && <div className={styles.layoutSelected} />}

                {layout.elements.length > 1 && (isLayoutHovered || isSelected) && (
                    <DragHandler
                        className={styles.layoutDragHandle}
                        slideId={slideId}
                        isActive={isSelected && !isTableContentSelected}
                        ariaLabel="Drag this layout"
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

                {layout.isTable && (
                    <>
                        <button className={`${styles.addColumnButton} ${styles.tableButton}`} onClick={handleAddColumn}>
                            +
                        </button>
                        <button className={`${styles.addRowButton} ${styles.tableButton}`} onClick={handleAddRow}>
                            +
                        </button>
                    </>
                )}

                {layout.isTable && (
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

import React, { RefObject, useState, useCallback, useMemo, memo } from 'react';
import { Layout, GridRow, GridCell, Element, TipTapRefs } from '@/types';
import { useDnd } from '@/contexts/DragDropContext';
import { generateGridTemplateAreas, generateGridTemplateColumns } from '@/types';
import GridCellElement from '../GridCellElement';
import styles from './LayoutContent.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import DragHandler from '../DragHandler';
import { useMenuSelectedCell, useMenuSelectedElement, useMenuSelectedLayout, useMenuStore } from '@/store/menuStore';
interface LayoutContentProps {
    layout: Layout;
    onDeleteElement: (layoutId: string, elementId: string) => void;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
}

// Pure function outside component to avoid recreation
function simpleHash(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

const LayoutContent: React.FC<LayoutContentProps> = ({
    layout,
    // onDeleteElement,
    tiptapRefs,
    presentationId,
    slideId
}) => {
    const { state } = useDnd();
    const { handleDragStart } = useDnd();
    const [isLayoutHovered, setIsLayoutHovered] = useState(false);

    // Use optimized selector hooks instead of full context
    const openMenu = useMenuStore.getState().openMenu;

    // Get only the needed state from SlideMenu
    const menuLayoutId = useMenuSelectedLayout();
    const menuElementId = useMenuSelectedElement();
    const menuCellId = useMenuSelectedCell();

    const handleMouseEnter = useCallback(() => {
        if (!isLayoutHovered) {
            setIsLayoutHovered(true);
        }
    }, [isLayoutHovered]);
    const handleMouseLeave = useCallback(() => {
        if (isLayoutHovered) {
            setIsLayoutHovered(false);
        }
    }, [isLayoutHovered]);


    // Memoize grid properties to prevent recalculations
    const gridTemplateAreas = useMemo(() =>
        generateGridTemplateAreas(layout.gridStructure),
    [layout.gridStructure]
    );

    const gridTemplateColumns = useMemo(() =>
        generateGridTemplateColumns(layout.gridStructure),
    [layout.gridStructure]
    );

    // Memoize layout properties
    const hasMultipleCellsInRow = useMemo(() =>
        layout.gridStructure.rows.some(row => row.cells.length > 1),
    [layout.gridStructure.rows]
    );

    // Memoize cell elements grouping
    const cellElements = useMemo(() => {
        const elements: Record<string, Element[]> = {};
        layout.elements.forEach(element => {
            if (!elements[element.cellId]) {
                elements[element.cellId] = [];
            }
            elements[element.cellId].push(element as Element);
        });
        return elements;
    }, [layout.elements]);

    // Detect if this is a layout with a single element in a single cell
    const isSingleElementSingleCellLayout = useMemo(() =>
        layout.elements.length === 1 &&
        layout.gridStructure.rows.length === 1 &&
        layout.gridStructure.rows[0].cells.length === 1,
    [layout.elements.length, layout.gridStructure.rows]
    );

    // console.log('columnDragPosition', columnDragPosition)
    const handleLayoutDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        handleDragStart(e, "", layout.id);

        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'layout',
            layoutId: layout.id,
            slideId: slideId
        }));
    }, [handleDragStart, layout.id, slideId]);

    const handleOpenMenu = useCallback(() =>
        openMenu({
            slideId,
            elementId: null,
            elementType: 'layout',
            layoutId: layout.id
        }),
    [openMenu, slideId, layout.id]
    );

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            openMenu({
                slideId,
                elementId: null,
                elementType: 'layout',
                layoutId: layout.id
            });
        }
    }, [openMenu, slideId, layout.id]);

    const handleAddColumn = useCallback(() => {
        usePresentationStore.getState().addColumnToTable(presentationId, slideId, layout.id, layout.gridStructure.columns);
    }, [layout, presentationId, slideId]);

    const handleAddRow = useCallback(() => {
        usePresentationStore.getState().addRowToTable(presentationId, slideId, layout.id, layout.gridStructure.rows.length);
    }, [layout, presentationId, slideId]);

    const isSelected = menuLayoutId === layout.id && menuElementId === null && menuCellId === null;

    return (
        <>
            <div
                className={`${styles.layout}`}
                data-layout-id={layout.id}
                data-is-single-element-layout={isSingleElementSingleCellLayout ? "true" : "false"}
                role="region"
                aria-label={`Layout ${layout.id}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {isSelected && <div className={styles.layoutSelected} />}

                {layout.elements.length > 1 && (isLayoutHovered || isSelected) && (
                    <DragHandler
                        className={styles.layoutDragHandle}
                        slideId={slideId}
                        isActive={isSelected}
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
                            data-layout-id={layout.id}
                            data-row-id={row.id}
                            className={`${styles.layoutContent} ${layout.isTable ? styles.tableLayoutContent : ''} ${hasMultipleCellsInRow ? styles.multiCellLayout : ''} ${className}`}
                            style={{
                                gridTemplateAreas,
                                gridTemplateColumns,
                            }}
                        >
                            {row.cells.map((cell: GridCell, cellIndex: number) => {
                                const cellId = cell.id;
                                const elements = cellElements[cellId] || [];
                                // const isLastCell = cellIndex === row.cells.length - 1;

                                const elementsIds = elements.map(element => element.id);
                                const key = `${cellId}-${simpleHash(JSON.stringify(elementsIds))}`;

                                return (
                                    <GridCellElement
                                        key={key}
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
                    )
                })}

                {layout.isTable && (
                    <>
                        <button
                            className={`${styles.addColumnButton} ${styles.tableButton}`}
                            onClick={handleAddColumn}
                        >
                            +
                        </button>
                        <button
                            className={`${styles.addRowButton} ${styles.tableButton}`}
                            onClick={handleAddRow}
                        >
                            +
                        </button>
                    </>
                )}

            </div>
        </>
    );
};

// Force the component to update when the store changes
export default memo(LayoutContent, (prevProps, nextProps) => {
    // Only re-render if layout changes
    return prevProps.layout === nextProps.layout &&
        prevProps.slideId === nextProps.slideId &&
        prevProps.presentationId === nextProps.presentationId;
});
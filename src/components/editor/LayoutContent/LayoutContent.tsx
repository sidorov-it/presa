import React, { RefObject, useState, useCallback, useMemo, memo } from 'react';
import { Layout, GridRow, GridCell, Element, TipTapRefs } from '@/types';
import { useDnd } from '@/contexts/DragDropContext';
import { generateGridTemplateAreas, generateGridTemplateColumns } from '@/types';
import GridCellElement from '../GridCellElement';
import styles from './LayoutContent.module.css';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import DragHandler from '../DragHandler';
import { usePresentationStore } from '@/store/presentationStore';

interface LayoutContentProps {
    layout: Layout;
    onSelectElement: (elementId: string) => void;
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
    onSelectElement,
    onDeleteElement,
    tiptapRefs,
    presentationId,
    slideId
}) => {
    const { state, handleDrop, handleDragStart } = useDnd();
    const { openMenu, state: { layoutId: menuLayoutId, elementId: menuElementId, columnId: menuColumnId } } = useSlideMenu();
    const [isLayoutHovered, setIsLayoutHovered] = useState(false);
    
    // Subscribe to version changes to ensure we re-render when needed
    const storeVersion = usePresentationStore(state => state.version);

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

    const handleLocalDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent propagation to avoid double triggering with global handler
        handleDrop(e);
    }, [handleDrop]);

    // Detect if this is a layout with a single element in a single cell
    const isSingleElementSingleCellLayout = useMemo(() =>
        layout.elements.length === 1 &&
        layout.gridStructure.rows.length === 1 &&
        layout.gridStructure.rows[0].cells.length === 1,
        [layout.elements.length, layout.gridStructure.rows]
    );

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
        openMenu(slideId, null, 'layout', layout.id),
        [openMenu, slideId, layout.id]
    );

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            openMenu(slideId, null, 'layout', layout.id);
        }
    }, [openMenu, slideId, layout.id]);

    const isSelected = menuLayoutId === layout.id && menuElementId === null && menuColumnId === null;
    const layoutClassName = styles.layoutContent;

    const handleMouseEnter = useCallback(() => setIsLayoutHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsLayoutHovered(false), []);

    return (
        <>
            <div
                className={`${styles.layout}`}
                data-layout-id={layout.id}
                data-is-single-element-layout={isSingleElementSingleCellLayout ? "true" : "false"}
                onDrop={handleLocalDrop}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                role="region"
                aria-label={`Layout ${layout.id}`}
                tabIndex={0}
            >
                {isSelected && <div className={styles.layoutSelected} />}

                {/* Layout drag handle */}
                {layout.elements.length > 1
                    && (isLayoutHovered || isSelected) 
                    && (
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
                {layout.gridStructure.rows.map((row: GridRow) => (
                    <div
                        key={row.id}
                        data-layout-id={layout.id}
                        data-row-id={row.id}
                        className={`${layoutClassName} ${hasMultipleCellsInRow ? styles.multiCellLayout : ''}`}
                        style={{
                            gridTemplateAreas,
                            gridTemplateColumns,
                        }}
                    >
                        {row.cells.map((cell: GridCell, cellIndex: number) => {
                            const cellId = cell.id;
                            const elements = cellElements[cellId] || [];
                            const isLastCell = cellIndex === row.cells.length - 1;

                            const elementsIds = elements.map(element => element.id);
                            const key = `${cellId}-${simpleHash(JSON.stringify(elementsIds))}`;

                            return (
                                <GridCellElement
                                    key={key}
                                    tiptapRefs={tiptapRefs}
                                    cell={cell}
                                    elements={elements}
                                    dragOverElement={state.indicators.elementIndicator}
                                    dragOverPosition={state.indicators.elementPosition}
                                    presentationId={presentationId}
                                    slideId={slideId}
                                    layoutId={layout.id}
                                    index={cellIndex}
                                    hasMultipleCells={hasMultipleCellsInRow}
                                    isLayoutHovered={isLayoutHovered}
                                    isLayoutSelected={isSelected}
                                    isLastCell={isLastCell}
                                    onSelect={(element) => onSelectElement(element.id)}
                                    onDelete={(element) => onDeleteElement(layout.id, element.id)}
                                />
                            );
                        })}
                    </div>
                ))}
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
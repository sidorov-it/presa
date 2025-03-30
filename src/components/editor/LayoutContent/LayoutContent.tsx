import React, { RefObject, useState } from 'react';
import { Layout, GridRow, GridCell, Element, TipTapRefs } from '@/types';
import { useDnd } from '@/contexts/DragDropContext';
import { generateGridTemplateAreas, generateGridTemplateColumns } from '@/types';
import GridCellElement from '../GridCellElement';
import styles from './LayoutContent.module.css';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import DragHandler from '../DragHandler';

interface LayoutContentProps {
    layout: Layout;
    onSelectElement: (elementId: string) => void;
    onDeleteElement: (layoutId: string, elementId: string) => void;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
}

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
    const [isSlideHovered, setIsSlideHovered] = useState(false);

    // Generate CSS grid properties from the grid structure
    const gridTemplateAreas = generateGridTemplateAreas(layout.gridStructure);
    const gridTemplateColumns = generateGridTemplateColumns(layout.gridStructure);

    // Check if the layout has multiple cells in a row
    const hasMultipleCellsInRow = layout.gridStructure.rows.some(row => row.cells.length > 1);

    // Group elements by cell
    const cellElements: Record<string, Element[]> = {};
    layout.elements.forEach(element => {
        if (!cellElements[element.cellId]) {
            cellElements[element.cellId] = [];
        }
        cellElements[element.cellId].push(element as Element);
    });

    // Remove layout drag class logic - we'll use global indicator now
    const layoutClassName = styles.layoutContent;

    const handleLocalDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent propagation to avoid double triggering with global handler
        handleDrop(e);
    };

    // Detect if this is a layout with a single element in a single cell
    const isSingleElementSingleCellLayout = layout.elements.length === 1 &&
        layout.gridStructure.rows.length === 1 &&
        layout.gridStructure.rows[0].cells.length === 1;

    return (
        <>
            <div
                className={styles.layout}
                data-layout-id={layout.id}
                data-is-single-element-layout={isSingleElementSingleCellLayout ? "true" : "false"}
                onDrop={handleLocalDrop}
                onMouseEnter={() => setIsSlideHovered(true)}
                onMouseLeave={() => setIsSlideHovered(false)}
            >
                {/* Layout drag handle */}
                {layout.elements.length > 1 && (
                    <DragHandler
                        className={styles.layoutDragHandle}
                        slideId={slideId}
                        isActive={menuLayoutId === layout.id && menuElementId === null && menuColumnId === null}
                        ariaLabel="Drag this layout"
                        data-layout-drag-handle={layout.id}
                        handleClick={() => openMenu(slideId, null, 'layout', layout.id)}
                        handleKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                openMenu(slideId, null, 'layout', layout.id);
                            }
                        }}
                        handleDragStart={(e) => {
                            e.preventDefault();
                        }}
                    />
                )}
                {layout.gridStructure.rows.map((row: GridRow) => (
                    <div
                        key={row.id}
                        data-layout-id={layout.id}
                        data-row-id={row.id}
                        className={layoutClassName}
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
                                    isSlideHovered={isSlideHovered}
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

// Remove the DropIndicator component - we'll use our global one

export default LayoutContent; 
import React, { useEffect } from 'react';
import { Layout, GridRow, GridCell, Element } from '@/types';
import { useDnd } from '@/contexts/DragDropContext';
import { generateGridTemplateAreas, generateGridTemplateColumns } from '@/types';
import GridCellElement from '../GridCellElement';
import styles from './SlideEditor.module.css';
import { TiptapRef } from '@/components/tiptap/Tiptap';

interface LayoutContentProps {
    layout: Layout;
    isFirstLayout: boolean;
    onSelectElement: (elementId: string) => void;
    onDeleteElement: (layoutId: string, elementId: string) => void;
    slideEditorRef: React.RefObject<HTMLDivElement>;
    tiptapRefs: React.RefObject<Record<string, React.RefObject<TiptapRef>>>;
    presentationId: string;
    slideId: string;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Преобразование в 32-битное число
    }
    return Math.abs(hash).toString(36); // Конвертация в строку
}

const LayoutContent: React.FC<LayoutContentProps> = ({
    layout,
    isFirstLayout,
    onSelectElement,
    onDeleteElement,
    slideEditorRef,
    tiptapRefs,
    presentationId,
    slideId
}) => {
    const { state, handleDrop, handleDragStart } = useDnd();

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
        cellElements[element.cellId].push(element);
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
                // className={layoutClassName}
                data-layout-id={layout.id}
                data-is-single-element-layout={isSingleElementSingleCellLayout ? "true" : "false"}
                onDrop={handleLocalDrop}
            >
                {/* Layout drag handle */}
                {layout.elements.length > 1 && (
                    <div
                        className={styles.layoutDragHandle}
                        draggable="true"
                        onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, layout.elements[0].id, layout.id, layout.elements[0].cellId);
                        }}
                        title="Drag this layout"
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
                                    slideEditorRef={slideEditorRef}
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
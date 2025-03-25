/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { GridCell, Element, GridStructure, getPredefinedGridStructures, Layout } from '@/types';
import { useDnd } from '@/contexts/DragDropContext';
import Tiptap, { TiptapRef } from '@/components/tiptap/Tiptap';
import styles from './GridCellElement.module.css'; // Make sure this exists
import { GridTextElement } from '@/types/grid-elements';
import { useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';
import { useEditorStore } from '@/store/editorStore';


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
    isLastCell: boolean;
    slideEditorRef: React.RefObject<HTMLDivElement>;
    tiptapRefs: React.RefObject<Record<string, React.RefObject<TiptapRef>>>;
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
    tiptapRefs,
    onSelect
}) => {
    const {
        handleDragStart    } = useDnd();

    const dragHandleRef = useRef<HTMLDivElement>(null);

    const { updateElement, updateLayout } = usePresentationStore();

    const cellClassName = `${styles.gridCell} ${hasMultipleCells ? styles.multiCell : ''}`;

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

    const handleEnterPressed = (element: Element) => () => {
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
                    content: '',
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

            // Update the slide with the new layouts
            usePresentationStore.getState().updateSlide(presentationId, slideId, {
                layouts: updatedLayouts
            });

            // Set the element to focus in the editor store
            useEditorStore.getState().setElementToFocus(
                firstNewEditorId,
                newLayoutId,
                newLayout.gridStructure.rows[0].cells[0].id
            );
        } else {
            // в строке больше 1 элемента. просто добавляем новый элемент
            const newElementId = generateId();
            const cell = row?.cells.find(c => c.id === element.cellId);
            if (!cell) return;

            const newElement: Element = {
                id: newElementId,
                type: 'editor' as const,
                textType: 'heading' as const,
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: {},
                zIndex: 0,
                cellId: cell.id,
            }

            const updatedElements = [...layout.elements];
            updatedElements.push(newElement);

            layout.elements = updatedElements;

            updateLayout(presentationId, slideId, layoutId, layout);
        }
    };

    const handleEditorContentChange = (elementId: string) => (content: string) => {
        updateElement(presentationId, slideId, layoutId, elementId, {
            content: content
        } as Partial<Element>);
    };


    // Render your component's elements
    const renderElement = (element: Element) => {
        return (
            <div 
                className={styles.elementContent}
                data-element-id={element.id}
                // data-layout-id={layoutId}
                // data-cell-id={element.cellId}
            >
                <div key={element.id} className={styles.elementWrapper}>
                    <div 
                        className={styles.elementDragHandle}
                        draggable="true"
                        onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, element.id, layoutId, element.cellId);
                        }}
                        title="Drag this element"
                    />
                    <Tiptap
                        key={element.id}
                        ref={tiptapRefs.current?.[element.id]}
                        id={element.cellId}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={true}
                        initialContent={getEditorContent(element)}
                        onEnterPressed={handleEnterPressed(element)}
                        onBackspacePressed={() => { }}
                        onFocus={() => onSelect(element)}
                        onContentChange={handleEditorContentChange(element.id)}
                        onBlur={() => { }}
                        customBubbleMenuTrigger={dragHandleRef}
                    />
                </div>
                <div>
                    elementId: {element.id}
                </div>
            </div>
        );
    };

    return (
        <div
            className={`${styles.gridCellElement} ${hasMultipleCells ? styles.multiCell : ''}`}
            data-element-id={cell.id}
            // data-layout-id={layoutId}
            data-cell-id={cell.id}
            data-cell="true"
            data-is-multi-cell={hasMultipleCells ? "true" : "false"}
        >
            {/* Drag handle for the entire cell */}
            {hasMultipleCells && (
                <div 
                    className={styles.cellDragHandle}
                    draggable="true"
                    onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, null, layoutId, cell.id);
                    }}
                    title="Drag this cell"
                />
            )}
            
            <div className={cellClassName}>
                <div 
                    className={styles.elementsContainer}
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
                    <div>
                        cellId: {cell.id} {cell.column}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GridCellElement; 
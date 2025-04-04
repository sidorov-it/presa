import Tiptap from '@/components/tiptap/Tiptap';
import styles from './ElementContent.module.css';
import DragHandler from '../DragHandler';
import { GridTextElement } from '@/types/grid-elements';
import { RefObject, useCallback } from 'react';
import { Element, GridStructure, getPredefinedGridStructures, Layout, TipTapRefs, TextElementType } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';
import { useEditorStore } from '@/store/editorStore';
import { useHistoryStore } from '@/store/historyStore';
import { getNewElement } from '@/elements/registry';
import { getColumnWidths } from '../SlideEditor/SlideEditor';

export const ElementContent = ({
    element,
    setElementIsHovered,
    menuElementId,
    // activeEditorId,
    elementIsHovered,
    handleClickElementDragHandle,
    handleKeyDownElementDragHandle,
    handleDragStartElementDragHandle,
    onSelect,
    slideId,
    tiptapRefs,
    dragHandleRef,
    presentationId,
    layoutId,
}: {
    element: Element;
    setElementIsHovered: (isHovered: boolean) => void;
    menuElementId: string | null;
    // activeEditorId?: string | null;
    elementIsHovered: boolean;
    handleClickElementDragHandle: (elementId: string, elementType: TextElementType) => (e: any) => void;
    handleKeyDownElementDragHandle: (elementId: string, elementType: TextElementType) => (e: any) => void;
    handleDragStartElementDragHandle: (elementId: string, elementType: TextElementType, cellId: string) => (e: any) => void;
    onSelect: (element: Element) => void;
    slideId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    dragHandleRef: RefObject<HTMLDivElement>;
    presentationId: string;
    layoutId: string;
}) => {
    const isCurrentEditorActive = useEditorStore(state => state.getActiveEditorId() === element.id);

    const handleEnterPressed = useCallback((element: Element) => (contentBeforeCursor?: string, contentAfterCursor?: string) => {
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
                    content: contentAfterCursor || '',
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

            updatedLayouts.forEach(layout => {
                layout.elements.forEach(el => {
                    if (el.id === element.id) {
                        return {
                            ...el,
                            content: contentBeforeCursor || ''
                        }
                    }
                    return el;
                })
            })

            // Update the slide with the new layouts
            usePresentationStore.getState().updateSlide(presentationId, slideId, {
                layouts: updatedLayouts
            });

            useHistoryStore.getState().commitTransaction(presentationId);
            // const updatedCurrentElements = layout.elements.map(el => {
            // if (el.id === element.id) {
            //     return {
            //         ...el,
            //         content: contentBeforeCursor || ''
            //     }
            // }
            // return el;
            // })

            // usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, {
            //     elements: updatedCurrentElements
            // });

            // Set the element to focus in the editor store
            useEditorStore.getState().setElementToFocus(
                firstNewEditorId,
                newLayoutId,
                newLayout.gridStructure.rows[0].cells[0].id
            );

            setTimeout(() => {
                tiptapRefs.current?.editors[firstNewEditorId]?.focus();
            }, 10);

        } else {
            // в строке больше 1 элемента. просто добавляем новый элемент
            const newElementId = generateId();
            const cell = row?.cells.find(c => c.id === element.cellId);
            if (!cell) return;

            const newElementIndex = layout.elements.findIndex(e => e.id === element.id);

            const newElement: Element = {
                id: newElementId,
                type: 'editor' as const,
                textType: 'heading' as const,
                content: contentAfterCursor || '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: {},
                zIndex: 0,
                cellId: cell.id,
            }

            const updatedElements = [...layout.elements];
            updatedElements.splice(newElementIndex + 1, 0, newElement);

            layout.elements = updatedElements;

            usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, layout);

            setTimeout(() => {
                tiptapRefs.current?.editors[newElementId]?.focus();
            }, 10)
        }
    }, [slideId, layoutId]);

    const handleEditorContentChange = useCallback((elementId: string) => (content: string) => {
        usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, elementId, {
            content: content
        } as Partial<Element>);
    }, [slideId, layoutId, presentationId]);



    const handleBackspacePressed = useCallback((element: Element) => () => {
        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return;

        const slide = presentation.slides.find(s => s.id === slideId);
        if (!slide) return;

        const layout = slide.layouts.find(l => l.id === layoutId);
        if (!layout) return;


        const elementsInCell = layout.elements.filter(e => e.cellId === element.cellId);

        const slideIndex = presentation.slides.findIndex(s => s.id === slideId);
        const layoutIndex = slide.layouts.findIndex(l => l.id === layoutId);

        const isMultiCellRow = layout.gridStructure.rows[0].cells.length > 1;


        if (layoutIndex === 0 && slideIndex === 0 && !isMultiCellRow) {
            // backspace в первой строке первого слайда -> ничего не делаем
            return;
        }

        if (elementsInCell.length === 1 && !isMultiCellRow && layoutIndex === 0 && slide.layouts.length > 1) {
            // склеиваем 2 слайда
            const currentSlideIndex = presentation.slides.findIndex(s => s.id === slideId);
            const previousSlideIndex = currentSlideIndex - 1;

            const previousSlide = presentation.slides[previousSlideIndex];

            if (previousSlide) {
                // берем лэйауты из текущего слайда
                const slideLayouts = [...slide.layouts];
                // удалеяем текущий лэйаут
                slideLayouts.splice(layoutIndex, 1);

                // берем оставшиеся и добавляем в предыдущий слайд
                const previousSlideLayouts = [...previousSlide.layouts, ...slideLayouts];
                useHistoryStore.getState().beginTransaction(presentationId, 'merge slides');

                const { deleteSlide, updateSlide } = usePresentationStore.getState()
                // удаляем текущий слайд
                deleteSlide(presentationId, slideId);

                updateSlide(presentationId, previousSlide.id, {
                    layouts: previousSlideLayouts
                });
                // usePresentationStore.getState().updateSlide(presentationId, slideId, {
                //     layouts: updatedLayouts
                // });
            } else {
                const updatedLayouts = [...slide.layouts];
                updatedLayouts.splice(layoutIndex, 1);
                usePresentationStore.getState().updateSlide(presentationId, slideId, {
                    layouts: updatedLayouts
                });
            }
        }
        // backspace не в первой строке -> удаляем layout
        else if (elementsInCell.length === 1 && !isMultiCellRow && layoutIndex !== 0 && slide.layouts.length > 1) {
            usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
        }
        // backspace в единственном элементе в ячейке с несколькими ячейками -> удаляем всю ячейку
        else if (isMultiCellRow && elementsInCell.length === 1) {
            const updatedLayout = { ...layout };
            const updatedElements = updatedLayout.elements.filter(e => e.cellId !== element.cellId);
            updatedLayout.elements = updatedElements;

            const updatedCells = updatedLayout.gridStructure.rows[0].cells.filter(c => c.id !== element.cellId)
                .map((cell, index) => ({
                    ...cell,
                    column: index
                }))
                .sort((a, b) => a.column - b.column);

            updatedLayout.gridStructure.rows[0].cells = updatedCells;
            updatedLayout.gridStructure.columns = updatedLayout.gridStructure.columns - 1;
            const updatedColumnWidths = getColumnWidths(updatedLayout.gridStructure.columns);
            updatedLayout.gridStructure.columnWidths = updatedColumnWidths;
            usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
        }
        // backspace в первом элементе в ячейке с несколькими элементами -> удаляем первый элемент. ставим фокус на следующем
        else if (isMultiCellRow && elementsInCell.length >= 1) {
            const updatedLayout = { ...layout };
            const updatedElements = updatedLayout.elements.filter(e => e.id !== element.id);
            updatedLayout.elements = updatedElements;
            usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
        }
        // удаление единственного элемента на слайде. удаляем весь слайд
        else if (elementsInCell.length === 1 && layout.elements.length === 1) {
            usePresentationStore.getState().deleteSlide(presentationId, slideId);
        }
    }, [slideId, layoutId]);

    // Handler for adding new elements via slash command
    const handleAddElement = useCallback((elementId: string) => (type: string) => {
        const elementData = getNewElement(type);
        if (elementData) {
            const newElementWithCell = {
                ...elementData,
                cellId: element.cellId,
                id: elementId
            };

            usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, elementId, newElementWithCell as Partial<Element>);

            tiptapRefs.current?.editors[elementId]?.editor.commands.setContent(elementData.content);
        }
    }, [slideId, layoutId, presentationId]);

    const handleSelect = useCallback((element: Element) => () => onSelect(element), [onSelect]);

    const getEditorContent = useCallback((element: Element): string => {
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
    }, []);

    return (
        <div
            className={`${styles.elementContent} themed-text`}
            data-element-id={element.id}
            onMouseEnter={() => {
                setElementIsHovered(true)
            }}
            onMouseLeave={() => {
                setElementIsHovered(false)
            }}
        >
            <div key={element.id} className={`${styles.elementWrapper}`}>
                {(menuElementId === element.id || isCurrentEditorActive || elementIsHovered) && (
                    <DragHandler
                        className={styles.elementDragHandle}
                        slideId={slideId}
                        isActive={menuElementId === element.id}
                        dataAttributes={{
                            'data-element-drag-handle': element.id,
                        }}
                        ariaLabel="Drag this element"
                        handleClick={handleClickElementDragHandle(element.id, element.type)}
                        handleKeyDown={handleKeyDownElementDragHandle(element.id, element.type)}
                        handleDragStart={handleDragStartElementDragHandle(element.id, element.type, element.cellId)}
                    />
                )}

                <Tiptap
                    key={element.id}
                    elementId={element.id}
                    tiptapRefs={tiptapRefs}
                    id={element.cellId}
                    initialContent={getEditorContent(element)}
                    onEnterPressed={handleEnterPressed(element)}
                    onBackspacePressed={handleBackspacePressed(element)}
                    onFocus={handleSelect(element)}
                    onContentChange={handleEditorContentChange(element.id)}
                    customBubbleMenuTrigger={dragHandleRef}
                    onAddElement={handleAddElement(element.id)}
                    presentationId={presentationId}
                    slideId={slideId}
                    layoutId={layoutId}
                />
            </div>
        </div>
    )
}
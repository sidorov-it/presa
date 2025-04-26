import Tiptap from '@/components/tiptap/Tiptap';
import styles from './ElementContent.module.css';
import DragHandler from '../DragHandler';
import { memo, RefObject, useCallback, useMemo, useState } from 'react';
import {
    Element,
    GridStructure,
    getPredefinedGridStructures,
    Layout,
    TipTapRefs,
    EditorElement,
    ElementConfig,
    ImageElement,
    ChartElement,
} from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';
import { useEditorStore } from '@/store/editorStore';
import { useHistoryStore } from '@/store/historyStore';
import { getElementConfig, getNewEditorElement, getNewElement, getNewTableLayout } from '@/elements/registry';
import { getColumnWidths } from '../SlideEditor/SlideEditor';
import { Image } from '@/elements/image';
import { useMenuStore } from '@/store/menuStore';
import { useShallow } from 'zustand/react/shallow';
import Chart from '@/elements/chart/Chart';
import SmartLayout from '@/elements/smartLayout/SmartLayout';

export const ElementContent = ({
    elementId,
    // elementIsHovered,
    // setElementIsHovered,
    handleClickElementDragHandle,
    handleKeyDownElementDragHandle,
    handleDragStartElementDragHandle,
    slideId,
    tiptapRefs,
    dragHandleRef,
    presentationId,
    layoutId,
    isInTable,
    hasMultipleCells,
}: {
    elementId: string;
    // setElementIsHovered: (isHovered: boolean) => void;
    // activeEditorId?: string | null;
    // elementIsHovered: boolean;
    handleClickElementDragHandle: (element: Element, elementConfig: ElementConfig) => (e: any) => void;
    handleKeyDownElementDragHandle: (element: Element, elementConfig: ElementConfig) => (e: any) => void;
    handleDragStartElementDragHandle: (element: Element) => (e: any) => void;
    slideId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    dragHandleRef: RefObject<HTMLDivElement>;
    presentationId: string;
    layoutId: string;
    isInTable: boolean;
    hasMultipleCells: boolean;
}) => {
    const element = usePresentationStore(state => state.getElement(presentationId, slideId, layoutId, elementId)!);

    const isCurrentEditorActive = useEditorStore(state => state.getActiveEditorId() === elementId);
    const elementConfig = useMemo(() => getElementConfig(element!.elementTypeId), [element]);

    const isMenuOpenOnCurrentElement = useMenuStore(
        useShallow(
            state =>
                state.elementId === elementId &&
                (element.elementTypeId !== 'smart-layout' || state.selectedSmartLayoutItemId === null)
        )
    );

    // const isSmartLayoutItemHovered = useMenuStore(useShallow(state => state.selectedSmartLayoutItemId === elementId));

    const [elementIsHovered, setElementIsHovered] = useState(false);

    // const elementToFocus = useEditorStore(state => state.elementToFocus);
    // const clearElementToFocus = useEditorStore.getState().clearElementToFocus;

    // const isElementToFocus = useMemo(() => elementToFocus?.elementId === elementId, [elementToFocus, elementId]);

    // useEffect(() => {
    //     if (isElementToFocus) {
    //         useEditorStore.getState().clearElementToFocus();
    //     }
    // }, [isElementToFocus]);

    const handleEnterPressed = useCallback(
        (element: Element) => (contentBeforeCursor?: string, contentAfterCursor?: string) => {
            // Start transaction at the beginning of the operation
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

                const newElement = getNewEditorElement(
                    defaultLayoutGridStructure.rows[0].cells[0].id,
                    contentAfterCursor
                );

                const firstNewEditorId = newElement.id;
                const newLayout: Layout = {
                    id: newLayoutId,
                    gridStructure: defaultLayoutGridStructure,
                    type: defaultGridType,
                    style: {},
                    elements: [newElement],
                };

                // Add the new layout to the slide
                const updatedLayouts = [...slide.layouts];
                const currentLayoutIndex = updatedLayouts.findIndex(l => l.id === layoutId);
                updatedLayouts.splice(currentLayoutIndex + 1, 0, newLayout);

                updatedLayouts.forEach(layout => {
                    layout.elements.forEach(el => {
                        if (el.id === element.id) {
                            return {
                                ...el,
                                content: contentBeforeCursor || '',
                            };
                        }
                        return el;
                    });
                });

                // Update the slide with the new layouts
                usePresentationStore.getState().updateSlide(
                    presentationId,
                    slideId,
                    {
                        layouts: updatedLayouts,
                    },
                    true
                );

                // useEditorStore.getState().setElementToFocus(
                //     firstNewEditorId,
                //     newLayoutId,
                //     newLayout.gridStructure.rows[0].cells[0].id
                // );

                useHistoryStore.getState().commitTransaction(presentationId);

                setTimeout(() => {
                    tiptapRefs.current?.editors[firstNewEditorId]?.editor.commands.focus('start');
                }, 10);
            } else {
                // в строке больше 1 элемента. просто добавляем новый элемент
                const cell = row?.cells.find(c => c.id === element.cellId);
                if (!cell) return;

                const newElementIndex = layout.elements.findIndex(e => e.id === element.id);

                const newElement = getNewEditorElement(cell.id, contentAfterCursor);

                const updatedElements = [...layout.elements];
                updatedElements.splice(newElementIndex + 1, 0, newElement);

                layout.elements = updatedElements;

                usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, layout);

                // useEditorStore.getState().setElementToFocus(
                //     newElement.id,
                //     layoutId,
                //     cell.id
                // );

                useHistoryStore.getState().commitTransaction(presentationId);

                setTimeout(() => {
                    tiptapRefs.current?.editors[newElement.id]?.editor.commands.focus('start');
                }, 10);
            }
        },
        [presentationId, slideId, layoutId, tiptapRefs]
    );

    const handleEditorContentChange = useCallback(
        (elementId: string) => (content: string, isEnterPress?: boolean) => {
            if (isEnterPress) {
                useHistoryStore.getState().beginTransaction(presentationId, 'update content');
                usePresentationStore.getState().updateElement(
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    {
                        content: content,
                    } as Partial<Element>,
                    true
                );
            } else {
                usePresentationStore.getState().updateElement(
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    {
                        content: content,
                    } as Partial<Element>,
                    false
                );
            }
        },
        [slideId, layoutId, presentationId]
    );

    const handleBackspacePressed = useCallback(
        (element: Element) => (isEmpty: boolean, textContent: string) => {
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

                    const { deleteSlide, updateSlide } = usePresentationStore.getState();
                    // удаляем текущий слайд
                    deleteSlide(presentationId, slideId);

                    updateSlide(presentationId, previousSlide.id, {
                        layouts: previousSlideLayouts,
                    });
                } else {
                    const updatedLayouts = [...slide.layouts];
                    updatedLayouts.splice(layoutIndex, 1);
                    usePresentationStore.getState().updateSlide(presentationId, slideId, {
                        layouts: updatedLayouts,
                    });
                }
            } else if (
                elementsInCell.length === 1 &&
                !isMultiCellRow &&
                layoutIndex !== 0 &&
                slide.layouts.length > 1 &&
                isEmpty
            ) {
                usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
            } else if (isMultiCellRow && elementsInCell.length === 1) {
                const updatedLayout = { ...layout };
                const updatedElements = updatedLayout.elements.filter(e => e.cellId !== element.cellId);
                updatedLayout.elements = updatedElements;

                const updatedCells = updatedLayout.gridStructure.rows[0].cells
                    .filter(c => c.id !== element.cellId)
                    .map((cell, index) => ({
                        ...cell,
                        column: index,
                    }))
                    .sort((a, b) => a.column - b.column);

                if (updatedCells.length > 1) {
                    updatedLayout.gridStructure.rows[0].cells = updatedCells;
                    updatedLayout.gridStructure.columns = updatedLayout.gridStructure.columns - 1;
                    const updatedColumnWidths = getColumnWidths(updatedLayout.gridStructure.columns);
                    updatedLayout.gridStructure.columnWidths = updatedColumnWidths;
                    usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
                } else {
                    layout.elements.forEach((el, index) => {
                        const newLayoutId = generateId(8);

                        const defaultGridType = 'single-column';

                        const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures('single-column');

                        const cellId = defaultLayoutGridStructure.rows[0].cells[0].id;

                        const newLayout: Layout = {
                            id: newLayoutId,
                            gridStructure: defaultLayoutGridStructure,
                            type: defaultGridType,
                            style: {},
                            elements: [
                                {
                                    ...el,
                                    cellId,
                                },
                            ],
                        };
                        usePresentationStore
                            .getState()
                            .addLayout(presentationId, slideId, newLayout, layoutIndex + index);
                    });
                    usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
                }
            }
            // backspace в первом элементе в ячейке с несколькими элементами -> удаляем первый элемент. ставим фокус на следующем
            else if (isMultiCellRow && elementsInCell.length >= 1) {
                const elementIndex = elementsInCell.findIndex(el => el.id === element.id);
                if (elementIndex === 0 && !isEmpty) {
                    return;
                } else if (elementIndex > 0) {
                    const previousElement = elementsInCell[elementIndex - 1];
                    const editorToUpdate = tiptapRefs.current?.editors[previousElement.id];

                    if (editorToUpdate) {
                        const oldContentSize = editorToUpdate.editor.state.doc.content.size - 1;

                        editorToUpdate.editor.chain().focus('end').insertContent(textContent).run();

                        usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, element.id);

                        setTimeout(() => {
                            const updatedEditor = tiptapRefs.current?.editors[previousElement.id];
                            updatedEditor?.editor.commands.focus(oldContentSize);
                        }, 10);
                    } else {
                        console.warn(
                            `Editor instance ${previousElement.id} not found in tiptapRefs. Cannot merge content programmatically.`
                        );
                    }
                } else {
                    const updatedLayout = { ...layout };
                    const updatedElements = updatedLayout.elements.filter(e => e.id !== element.id);
                    updatedLayout.elements = updatedElements;
                    usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
                }
            }
            // удаление единственного элемента на слайде. удаляем весь слайд
            else if (elementsInCell.length === 1 && layout.elements.length === 1 && isEmpty) {
                usePresentationStore.getState().deleteSlide(presentationId, slideId);
            } else if (elementsInCell.length === 1 && layout.elements.length === 1) {
                // объединяем контент с контентом предыдущего редактора
                const previousLayout = slide.layouts[layoutIndex - 1];

                if (previousLayout.gridStructure.columns === 1) {
                    const elementInPreviousLayout = previousLayout.elements[0];
                    const editorToUpdate = tiptapRefs.current?.editors[elementInPreviousLayout.id];

                    if (editorToUpdate) {
                        const oldContentSize = editorToUpdate.editor.state.doc.content.size - 1;

                        editorToUpdate.editor.chain().focus('end').insertContent(textContent).run();

                        usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);

                        setTimeout(() => {
                            const updatedEditor = tiptapRefs.current?.editors[elementInPreviousLayout.id];
                            updatedEditor?.editor.commands.focus(oldContentSize);
                        }, 10);
                    } else {
                        console.warn(
                            `Editor instance ${elementInPreviousLayout.id} not found in tiptapRefs. Cannot merge content programmatically.`
                        );
                    }
                }
            }
        },
        [presentationId, slideId, layoutId, tiptapRefs]
    );

    // Handler for adding new elements via slash command
    const handleAddElement = useCallback(
        (elementId: string) => (type: string) => {
            if (type.startsWith('table-')) {
                const tableLayout = getNewTableLayout(type);
                if (tableLayout) {
                    usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, tableLayout);
                }
            } else {
                const elementData = getNewElement(type);

                if (elementData) {
                    const newElementWithCell = {
                        ...elementData,
                        cellId: element.cellId,
                        id: elementId,
                    };

                    usePresentationStore
                        .getState()
                        .updateElement(
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            newElementWithCell as Partial<Element>
                        );

                    if (elementConfig.hasTextEditor) {
                        tiptapRefs.current?.editors[elementId]?.editor.commands.setContent(
                            (elementData as EditorElement).content
                        );
                    }
                }
            }
        },
        [presentationId, slideId, layoutId, element.cellId, elementConfig.hasTextEditor, tiptapRefs]
    );

    const getEditorContent = useCallback(
        (element: Element): string => {
            if (elementConfig.hasTextEditor) {
                return (element as EditorElement).content;
            }

            return `<p>Неподдерживаемый тип элемента: ${element.elementTypeId}</p>`;
        },
        [elementConfig.hasTextEditor]
    );

    const handleBlur = useCallback(() => {
        useEditorStore.getState().setActiveEditor(null);
    }, []);

    const renderElementContent = useCallback(
        (element: Element, isFocused: boolean) => {
            if (elementConfig.hasTextEditor) {
                return (
                    <Tiptap
                        key={element.id}
                        elementConfig={elementConfig}
                        elementId={element.id}
                        tiptapRefs={tiptapRefs}
                        id={element.id}
                        // autoFocus={isElementToFocus}
                        initialContent={getEditorContent(element)}
                        onEnterPressed={handleEnterPressed(element)}
                        onBackspacePressed={handleBackspacePressed(element)}
                        onContentChange={handleEditorContentChange(element.id)}
                        onBlur={handleBlur}
                        customBubbleMenuTrigger={dragHandleRef}
                        onAddElement={handleAddElement(element.id)}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                    />
                );
            } else if (element.elementTypeId === 'image') {
                return (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image
                        element={element as ImageElement}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        hasMultipleCells={hasMultipleCells}
                    />
                );
            } else if (element.elementTypeId.includes('chart')) {
                return (
                    <Chart
                        element={element as ChartElement}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        hasMultipleCells={hasMultipleCells}
                    />
                );
            } else if (element.elementTypeId === 'smart-layout') {
                return (
                    <SmartLayout
                        elementId={element.id}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        tiptapRefs={tiptapRefs}
                        isFocused={isFocused}
                    />
                );
            }
            return <div className={styles.unsupportedElement}>Unsupported element type: {element.elementTypeId}</div>;
        },
        [
            elementConfig,
            tiptapRefs,
            getEditorContent,
            handleEnterPressed,
            handleBackspacePressed,
            handleEditorContentChange,
            handleBlur,
            dragHandleRef,
            handleAddElement,
            presentationId,
            slideId,
            layoutId,
            hasMultipleCells,
        ]
    );

    return (
        <div
            key={element.id}
            className={`${styles.elementContent}`}
            data-element-id={element.id}
            onMouseEnter={() => {
                if (!elementIsHovered) {
                    setElementIsHovered(true);
                }
            }}
            onMouseLeave={() => {
                if (elementIsHovered) {
                    setElementIsHovered(false);
                }
            }}
        >
            <div className={`${styles.elementWrapper}`}>
                {!isInTable && (isMenuOpenOnCurrentElement || isCurrentEditorActive || elementIsHovered) && (
                    <DragHandler
                        className={styles.elementDragHandle}
                        slideId={slideId}
                        isActive={isMenuOpenOnCurrentElement}
                        dataAttributes={{
                            'data-element-drag-handle': element.id,
                        }}
                        ariaLabel="Drag this element"
                        handleClick={handleClickElementDragHandle(element as Element, elementConfig)}
                        handleKeyDown={handleKeyDownElementDragHandle(element as Element, elementConfig)}
                        handleDragStart={handleDragStartElementDragHandle(element as Element)}
                    />
                )}

                {renderElementContent(
                    element as Element,
                    isMenuOpenOnCurrentElement || isCurrentEditorActive || elementIsHovered
                )}
            </div>
        </div>
    );
};

const ElementContentMemo = memo(ElementContent, (prevProps, nextProps) => {
    return (
        prevProps.elementId === nextProps.elementId &&
        prevProps.slideId === nextProps.slideId &&
        prevProps.layoutId === nextProps.layoutId &&
        // prevProps.isLastCell === nextProps.isLastCell &&
        prevProps.elementId === nextProps.elementId &&
        prevProps.slideId === nextProps.slideId &&
        prevProps.presentationId === nextProps.presentationId &&
        prevProps.layoutId === nextProps.layoutId &&
        prevProps.isInTable === nextProps.isInTable &&
        prevProps.hasMultipleCells === nextProps.hasMultipleCells
    );
});

ElementContentMemo.displayName = 'ElementContentMemo';

export default ElementContentMemo;

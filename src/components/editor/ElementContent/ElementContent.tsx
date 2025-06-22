/* eslint-disable indent */
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import styles from './ElementContent.module.css';
import DragHandler from '../DragHandler';
import { memo, RefObject, useCallback, useMemo, useState } from 'react';
import { GridStructure, Layout, TipTapRefs, EditorElement, ElementConfig } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';
import { useEditorStore } from '@/store/editorStore';
import { useHistoryStore } from '@/store/historyStore';

import Image from '@/elements/image';
import { useMenuStore } from '@/store/menuStore';
import { useShallow } from 'zustand/react/shallow';
import Chart from '@/elements/chart';
import SmartLayout from '@/elements/smartLayout/SmartLayout';
import Box from '@/elements/box';
import getColumnWidths from '@/utils/getColumnWidths';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { MenuItem } from '@/types/templates';
import { getPredefinedGridStructures } from '@/utils/getPredefinedGridStructures';
import { getElementConfig } from '@/utils/getElementConfig';
import { getNewEditorElement } from '@/utils/getNewEditorElement';
import { getNewLayoutWithTable } from '@/utils/getNewLayoutWithTable';
import { getNewElement } from '@/utils/getNewElement';
import { ElementType } from '@/types/elements';

export const ElementContent = ({
    elementId,
    cellId,
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
    cellId: string;
    // setElementIsHovered: (isHovered: boolean) => void;
    // activeEditorId?: string | null;
    // elementIsHovered: boolean;
    handleClickElementDragHandle: (elementId: string, elementConfig: ElementConfig) => (e: any) => void;
    handleKeyDownElementDragHandle: (elementId: string, elementConfig: ElementConfig) => (e: any) => void;
    handleDragStartElementDragHandle: (elementId: string) => (e: any) => void;
    slideId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    dragHandleRef: RefObject<HTMLDivElement>;
    presentationId: string;
    layoutId: string;
    isInTable: boolean;
    hasMultipleCells: boolean;
}) => {
    const isReadOnly = useReadOnly();

    const elementTypeId = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId)!.elementTypeId
    );

    const isCurrentEditorActive = useEditorStore(state => state.getActiveEditorId() === elementId);
    const elementConfig = useMemo(() => getElementConfig(elementTypeId), [elementTypeId]);
    const slideBackground = usePresentationStore(state => state.getSlide(presentationId, slideId)?.background?.value);

    const isMenuOpenOnCurrentElement = useMenuStore(
        useShallow(
            state =>
                state.elementId === elementId &&
                (elementTypeId !== 'smart-layout' || state.selectedSmartLayoutItemId === null)
        )
    );

    const [elementIsHovered, setElementIsHovered] = useState(false);

    const handleEnterPressed = useCallback(
        (contentBeforeCursor?: string, contentAfterCursor?: string) => {
            // Start transaction at the beginning of the operation
            // Получаем текущий макет
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return;

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return;

            const layout = slide.layouts.find(l => l.id === layoutId);
            if (!layout) return;

            const row = layout.gridStructure.rows.find(r => r.cells.find(c => c.id === cellId));

            // в строке 1 элемент. создаем новую строку
            if (row!.cells.length === 1) {
                // Instead of adding a new row to the grid structure, we'll add a new block layout
                // Create a new layout with a grid that has 1 row and the same number of columns as the current layout
                const newLayoutId = generateId(8);

                const defaultGridType = 'blank';

                const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

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
                        if (el.id === elementId) {
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
                const cell = row?.cells.find(c => c.id === cellId);
                if (!cell) return;

                const newElementIndex = layout.elements.findIndex(e => e.id === elementId);

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
        [presentationId, slideId, layoutId, elementId, tiptapRefs, cellId]
    );

    const handleEditorContentChange = useCallback(
        (content: string, isEnterPress?: boolean, isTransaction?: boolean) => {
            if (isEnterPress) {
                useHistoryStore.getState().beginTransaction(presentationId, 'update content');
                usePresentationStore.getState().updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: {
                        content,
                    },
                    createHistoryEntry: true,
                    isTextElement: true,
                });
            } else {
                usePresentationStore.getState().updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: {
                        content,
                    },
                    createHistoryEntry: !!isTransaction,
                    isTextElement: true,
                });
            }
        },
        [presentationId, slideId, layoutId, elementId]
    );

    // Handler for adding new elements via slash command
    const handleAddElement = useCallback(
        (elementId: string) => (menuItem: MenuItem) => {
            if (menuItem.elementTypeId.startsWith('table')) {
                const tableLayout = getNewLayoutWithTable(menuItem.props?.columns || 2, menuItem.props?.rows || 2);
                if (tableLayout) {
                    usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, tableLayout);
                }
            } else {
                const elementData = getNewElement(menuItem);

                if (elementData) {
                    const newElementWithCell = {
                        ...elementData,
                        cellId,
                        id: elementId,
                    };

                    usePresentationStore.getState().updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: {
                            ...newElementWithCell,
                        },
                    });

                    if (elementConfig?.hasTextEditor) {
                        tiptapRefs.current?.editors[elementId]?.editor.commands.setContent(
                            (elementData as EditorElement).content
                        );
                    }
                }
            }
        },
        [presentationId, slideId, layoutId, cellId, elementConfig?.hasTextEditor, tiptapRefs]
    );

    const handleBackspacePressed = useCallback(
        (isEmpty: boolean, textContent: string) => {
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return;

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return;

            const layout = slide.layouts.find(l => l.id === layoutId);
            if (!layout) return;

            const elementsInCell = layout.elements.filter(e => e.cellId === cellId);

            // Early return if this is the only element in a table cell
            if (isInTable && elementsInCell.length === 1) {
                return;
            }

            const layoutIndex = slide.layouts.findIndex(l => l.id === layoutId);

            const isMultiCellRow = layout.gridStructure.rows[0].cells.length > 1;

            if (layoutIndex === 0 && !isMultiCellRow && slide.layouts.length === 1) {
                // backspace в первой строке единственного лэйаута -> ничего не делаем
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
                const previousLayout = slide.layouts[layoutIndex - 1];

                if (previousLayout.gridStructure.columns === 1) {
                    const elementInPreviousLayout = previousLayout.elements[previousLayout.elements.length - 1];
                    const editorInPreviousLayout = tiptapRefs.current?.editors[elementInPreviousLayout.id];

                    if (editorInPreviousLayout) {
                        usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);

                        setTimeout(() => {
                            editorInPreviousLayout.editor.commands.focus('end');
                        }, 10);
                    } else {
                        console.warn(
                            `Editor instance ${elementInPreviousLayout.id} not found in tiptapRefs. Cannot merge content programmatically.`
                        );
                    }
                }

                usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
            } else if (isMultiCellRow && elementsInCell.length === 1) {
                const updatedLayout = { ...layout };
                const updatedElements = updatedLayout.elements.filter(e => e.cellId !== cellId);
                updatedLayout.elements = updatedElements;

                const updatedCells = updatedLayout.gridStructure.rows[0].cells
                    .filter(c => c.id !== cellId)
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

                        const defaultGridType = 'blank';

                        const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

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
                const elementIndex = elementsInCell.findIndex(el => el.id === elementId);
                if (elementIndex === 0 && !isEmpty) {
                    return;
                } else if (elementIndex > 0) {
                    const previousElement = elementsInCell[elementIndex - 1];
                    const editorToUpdate = tiptapRefs.current?.editors[previousElement.id];

                    if (editorToUpdate) {
                        const oldContentSize = editorToUpdate.editor.state.doc.content.size - 1;

                        editorToUpdate.editor.chain().focus('end').insertContent(textContent).run();

                        usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);

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
                    const updatedElements = updatedLayout.elements.filter(e => e.id !== elementId);
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
        [presentationId, slideId, layoutId, cellId, elementId, tiptapRefs, isInTable]
    );

    const handleBlur = useCallback(() => {
        useEditorStore.getState().setActiveEditor(null);
        useMenuStore.getState().closeMenu();
    }, []);

    const renderElementContent = useCallback(
        (elementId: string, isFocused: boolean) => {
            if (elementConfig!.hasTextEditor) {
                return (
                    <Tiptap
                        key={elementId}
                        isInTable={isInTable}
                        elementConfig={elementConfig}
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        id={elementId}
                        onEnterPressed={handleEnterPressed}
                        onBackspacePressed={handleBackspacePressed}
                        onContentChange={handleEditorContentChange}
                        onBlur={handleBlur}
                        customBubbleMenuTrigger={dragHandleRef}
                        onAddElement={handleAddElement(elementId)}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isReadOnly={isReadOnly}
                    />
                );
            } else if (elementTypeId === 'image') {
                return (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image
                        elementId={elementId}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        hasMultipleCells={hasMultipleCells}
                    />
                );
            } else if (elementTypeId.includes('chart')) {
                return (
                    <Chart
                        elementId={elementId}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        hasMultipleCells={hasMultipleCells}
                        slideBackground={slideBackground}
                    />
                );
            } else if (elementTypeId === 'smart-layout') {
                return (
                    <SmartLayout
                        elementId={elementId}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        tiptapRefs={tiptapRefs}
                        isFocused={isFocused}
                    />
                );
            } else if (elementTypeId === ElementType.BOX) {
                return (
                    <Box
                        elementId={elementId}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        tiptapRefs={tiptapRefs}
                    />
                );
            }
            return <div className={styles.unsupportedElement}>Unsupported element type: {elementTypeId}</div>;
        },
        [
            elementConfig,
            elementTypeId,
            isInTable,
            tiptapRefs,
            handleEnterPressed,
            handleBackspacePressed,
            handleEditorContentChange,
            handleBlur,
            dragHandleRef,
            handleAddElement,
            presentationId,
            slideId,
            layoutId,
            isReadOnly,
            hasMultipleCells,
        ]
    );

    if (!elementConfig) {
        return <div>Element config not found {elementTypeId}</div>;
    }
    return (
        <div
            key={elementId}
            className={`${styles.elementContent}`}
            data-element-id={elementId}
            onMouseEnter={() => {
                if (!elementIsHovered && !isReadOnly) {
                    setElementIsHovered(true);
                }
            }}
            onMouseLeave={() => {
                if (elementIsHovered && !isReadOnly) {
                    setElementIsHovered(false);
                }
            }}
        >
            <div className={`${styles.elementWrapper}`}>
                {!isReadOnly &&
                    !isInTable &&
                    (isMenuOpenOnCurrentElement || isCurrentEditorActive || elementIsHovered) && (
                        <DragHandler
                            className={`${styles.elementDragHandle} ${hasMultipleCells ? styles.elementDragHandleMultipleCells : ''}`}
                            slideId={slideId}
                            isActive={isMenuOpenOnCurrentElement}
                            dataAttributes={{
                                'data-element-drag-handle': elementId,
                            }}
                            ariaLabel="Drag this element"
                            handleClick={handleClickElementDragHandle(elementId, elementConfig)}
                            handleKeyDown={handleKeyDownElementDragHandle(elementId, elementConfig)}
                            handleDragStart={handleDragStartElementDragHandle(elementId)}
                        />
                    )}

                {renderElementContent(
                    elementId,
                    isMenuOpenOnCurrentElement || isCurrentEditorActive || elementIsHovered
                )}
            </div>
        </div>
    );
};

const ElementContentMemo = memo(ElementContent, (prevProps, nextProps) => {
    return (
        prevProps.elementId === nextProps.elementId &&
        prevProps.cellId === nextProps.cellId &&
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

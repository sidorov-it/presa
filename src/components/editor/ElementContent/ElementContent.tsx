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
import { useUIStateStore } from '@/store/uiStateStore';
import { useShallow } from 'zustand/react/shallow';
import Chart from '@/elements/chart';
import SmartLayout from '@/elements/smartLayout/SmartLayout';
import Box from '@/elements/box';
import Buttons from '@/elements/button';
import getColumnWidths from '@/utils/getColumnWidths';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { MenuItem } from '@/types/templates';
import { getPredefinedGridStructures } from '@/utils/getPredefinedGridStructures';
import { getElementConfig } from '@/utils/getElementConfig';
import { getNewEditorElement } from '@/utils/getNewEditorElement';
import { getNewLayoutWithTable } from '@/utils/getNewLayoutWithTable';
import { getNewElement } from '@/utils/getNewElement';
import { ElementType } from '@/types/elements';

/**
 * Convert HTML with lists to flat paragraphs to avoid extra empty lines when merging
 */
const convertListsToFlatParagraphs = (html: string): string => {
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find all list containers (ul, ol, taskList)
    const lists = doc.querySelectorAll('ul, ol');

    lists.forEach(list => {
        const paragraphs: HTMLElement[] = [];
        
        // Extract all list items
        const listItems = list.querySelectorAll('li');
        
        listItems.forEach(li => {
            // Check if li contains a paragraph
            const childParagraphs = li.querySelectorAll('p');
            
            if (childParagraphs.length > 0) {
                // If li contains paragraphs, extract them
                childParagraphs.forEach(p => {
                    const newP = doc.createElement('p');
                    // Copy all child nodes from the paragraph
                    while (p.firstChild) {
                        newP.appendChild(p.firstChild);
                    }
                    paragraphs.push(newP);
                });
            } else {
                // If li doesn't contain a paragraph, wrap content in a paragraph
                const newP = doc.createElement('p');
                while (li.firstChild) {
                    newP.appendChild(li.firstChild);
                }
                paragraphs.push(newP);
            }
        });

        // Replace the list with the extracted paragraphs
        const parent = list.parentNode;
        if (parent) {
            paragraphs.forEach(p => {
                parent.insertBefore(p, list);
            });
            parent.removeChild(list);
        }
    });

    return doc.body.innerHTML;
};

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
        useShallow(state => state.getElement(presentationId, slideId, layoutId, elementId)!.elementTypeId)
    );

    const isCurrentEditorActive = useEditorStore(state => state.getActiveEditorId() === elementId);
    const elementConfig = useMemo(() => getElementConfig(elementTypeId), [elementTypeId]);
    const slideBackground = usePresentationStore(state => state.getSlide(presentationId, slideId)?.background?.value);

    const isElementSelected = useUIStateStore(
        state =>
            state.selectedElementId === elementId &&
            elementTypeId !== ElementType.TEXT &&
            elementTypeId !== ElementType.QUOTE
    );

    const isMenuOpenOnCurrentElement = useUIStateStore(
        useShallow(
            state =>
                state.selectedElementId === elementId &&
                state.isContextMenuOpen === true &&
                (elementTypeId !== 'smart-layout' || state.selectedSmartLayoutItemId === null)
        )
    );

    const [elementIsHovered, setElementIsHovered] = useState(false);

    const handleEnterPressed = useCallback(
        (contentBeforeCursor?: string, contentAfterCursor?: string, preservedStyles?: any) => {
            // Start transaction at the beginning of the operation
            // Получаем текущий макет

            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return;

            const slide = presentation.slides.find(s => s.id === slideId);
            if (!slide) return;

            const layout = slide.layouts.find(l => l.id === layoutId);
            if (!layout) return;

            const row = layout.gridStructure.rows.find(r => r.cells.find(c => c.id === cellId));

            // Проверяем, является ли это разбиением списка (оба contentBefore и contentAfter содержат списки)
            const isListSplit =
                contentBeforeCursor &&
                contentAfterCursor &&
                (contentBeforeCursor.includes('<ol') ||
                    contentBeforeCursor.includes('<ul') ||
                    contentBeforeCursor.includes('<li')) &&
                (contentAfterCursor.includes('<ol') ||
                    contentAfterCursor.includes('<ul') ||
                    contentAfterCursor.includes('<li'));

            if (isListSplit && row!.cells.length === 1) {
                // Разделение списка: создаем 3 layout (список до, пустой текст, список после)
                useHistoryStore.getState().beginTransaction(presentationId, 'split list');

                const defaultGridType = 'blank';
                const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

                // 1. Обновляем текущий элемент с контентом до
                usePresentationStore.getState().updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: {
                        content: contentBeforeCursor,
                    },
                    createHistoryEntry: true,
                    isTextElement: true,
                });

                // 2. Создаем layout с пустым текстовым элементом
                const emptyTextLayoutId = generateId(8);
                const emptyTextElement = {
                    ...getNewEditorElement('<p><span class="body-text normal-text"></span></p>', {}),
                    cellId: defaultLayoutGridStructure.rows[0].cells[0].id,
                };
                const emptyTextLayout: Layout = {
                    id: emptyTextLayoutId,
                    gridStructure: defaultLayoutGridStructure,
                    type: defaultGridType,
                    style: {},
                    elements: [emptyTextElement],
                };

                // 3. Создаем layout со списком после
                const afterListLayoutId = generateId(8);
                const afterListElement = {
                    ...getNewEditorElement(contentAfterCursor, {}),
                    cellId: defaultLayoutGridStructure.rows[0].cells[0].id,
                };
                const afterListLayout: Layout = {
                    id: afterListLayoutId,
                    gridStructure: defaultLayoutGridStructure,
                    type: defaultGridType,
                    style: {},
                    elements: [afterListElement],
                };

                // Получаем обновленный slide после изменения текущего элемента
                const updatedPresentation = usePresentationStore.getState().getPresentation(presentationId);
                const updatedSlide = updatedPresentation?.slides.find(s => s.id === slideId);
                if (!updatedSlide) {
                    useHistoryStore.getState().commitTransaction(presentationId);
                    return;
                }

                const updatedLayouts = [...updatedSlide.layouts];
                const newCurrentLayoutIndex = updatedLayouts.findIndex(l => l.id === layoutId);

                // Вставляем новые layouts после текущего
                updatedLayouts.splice(newCurrentLayoutIndex + 1, 0, emptyTextLayout, afterListLayout);

                // Обновляем slide с новыми layouts
                usePresentationStore.getState().updateSlide(
                    presentationId,
                    slideId,
                    {
                        layouts: updatedLayouts,
                    },
                    true
                );

                useHistoryStore.getState().commitTransaction(presentationId);

                setTimeout(() => {
                    tiptapRefs.current?.editors[emptyTextElement.id]?.editor.commands.focus('start');
                }, 10);

                return;
            }

            // Проверяем случай, когда есть список до, но нет списка после (конец списка)
            const isListEnd =
                contentBeforeCursor &&
                (!contentAfterCursor || contentAfterCursor.trim() === '' || contentAfterCursor.trim() === '<p></p>') &&
                (contentBeforeCursor.includes('<ol') ||
                    contentBeforeCursor.includes('<ul') ||
                    contentBeforeCursor.includes('<li'));

            if (isListEnd && row!.cells.length === 1) {
                // Конец списка: обновляем текущий элемент и создаем пустой текст
                useHistoryStore.getState().beginTransaction(presentationId, 'end list');

                const defaultGridType = 'blank';
                const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

                // 1. Обновляем текущий элемент с контентом списка
                usePresentationStore.getState().updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: {
                        content: contentBeforeCursor,
                    },
                    createHistoryEntry: true,
                    isTextElement: true,
                });

                // 2. Создаем layout с пустым текстовым элементом
                const emptyTextLayoutId = generateId(8);
                const emptyTextElement = {
                    ...getNewEditorElement('<p><span class="body-text normal-text"></span></p>', {}),
                    cellId: defaultLayoutGridStructure.rows[0].cells[0].id,
                };
                const emptyTextLayout: Layout = {
                    id: emptyTextLayoutId,
                    gridStructure: defaultLayoutGridStructure,
                    type: defaultGridType,
                    style: {},
                    elements: [emptyTextElement],
                };

                // Получаем обновленный slide после изменения текущего элемента
                const updatedPresentation = usePresentationStore.getState().getPresentation(presentationId);
                const updatedSlide = updatedPresentation?.slides.find(s => s.id === slideId);
                if (!updatedSlide) {
                    useHistoryStore.getState().commitTransaction(presentationId);
                    return;
                }

                const updatedLayouts = [...updatedSlide.layouts];
                const currentLayoutIndex = updatedLayouts.findIndex(l => l.id === layoutId);

                // Вставляем новый layout после текущего
                updatedLayouts.splice(currentLayoutIndex + 1, 0, emptyTextLayout);

                // Обновляем slide с новыми layouts
                usePresentationStore.getState().updateSlide(
                    presentationId,
                    slideId,
                    {
                        layouts: updatedLayouts,
                    },
                    true
                );

                useHistoryStore.getState().commitTransaction(presentationId);

                setTimeout(() => {
                    tiptapRefs.current?.editors[emptyTextElement.id]?.editor.commands.focus('start');
                }, 10);

                return;
            }

            // Проверяем случай, когда нет списка до, но есть список после (начало списка)
            const isListStart =
                (!contentBeforeCursor ||
                    contentBeforeCursor.trim() === '' ||
                    contentBeforeCursor.trim() === '<p></p>') &&
                contentAfterCursor &&
                (contentAfterCursor.includes('<ol') ||
                    contentAfterCursor.includes('<ul') ||
                    contentAfterCursor.includes('<li'));

            if (isListStart && row!.cells.length === 1) {
                // Начало списка: создаем пустой текст и список после
                useHistoryStore.getState().beginTransaction(presentationId, 'start list');

                const defaultGridType = 'blank';
                const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

                // 1. Обновляем текущий элемент как пустой текст
                usePresentationStore.getState().updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: {
                        content: '<p><span class="body-text normal-text"></span></p>',
                    },
                    createHistoryEntry: true,
                    isTextElement: true,
                });

                // 2. Создаем layout со списком после
                const afterListLayoutId = generateId(8);
                const afterListElement = {
                    ...getNewEditorElement(contentAfterCursor!, {}),
                    cellId: defaultLayoutGridStructure.rows[0].cells[0].id,
                };
                const afterListLayout: Layout = {
                    id: afterListLayoutId,
                    gridStructure: defaultLayoutGridStructure,
                    type: defaultGridType,
                    style: {},
                    elements: [afterListElement],
                };

                // Получаем обновленный slide после изменения текущего элемента
                const updatedPresentation = usePresentationStore.getState().getPresentation(presentationId);
                const updatedSlide = updatedPresentation?.slides.find(s => s.id === slideId);
                if (!updatedSlide) {
                    useHistoryStore.getState().commitTransaction(presentationId);
                    return;
                }

                const updatedLayouts = [...updatedSlide.layouts];
                const currentLayoutIndex = updatedLayouts.findIndex(l => l.id === layoutId);

                // Вставляем новый layout после текущего
                updatedLayouts.splice(currentLayoutIndex + 1, 0, afterListLayout);

                // Обновляем slide с новыми layouts
                usePresentationStore.getState().updateSlide(
                    presentationId,
                    slideId,
                    {
                        layouts: updatedLayouts,
                    },
                    true
                );

                useHistoryStore.getState().commitTransaction(presentationId);

                setTimeout(() => {
                    tiptapRefs.current?.editors[elementId]?.editor.commands.focus('start');
                }, 10);

                return;
            }

            // Обрабатываем случаи разделения списка в multi-cell row
            if (row!.cells.length > 1) {
                const cell = row?.cells.find(c => c.id === cellId);
                if (!cell) return;

                // Проверяем, является ли это разбиением списка
                if (isListSplit) {
                    useHistoryStore.getState().beginTransaction(presentationId, 'split list in cell');

                    // 1. Обновляем текущий элемент с контентом до
                    usePresentationStore.getState().updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: {
                            content: contentBeforeCursor,
                        },
                        createHistoryEntry: true,
                        isTextElement: true,
                    });

                    // 2. Создаем пустой текстовый элемент
                    const emptyTextElement = {
                        ...getNewEditorElement('<p><span class="body-text normal-text"></span></p>', {}),
                        cellId: cell.id,
                    };

                    // 3. Создаем элемент со списком после
                    const afterListElement = {
                        ...getNewEditorElement(contentAfterCursor, {}),
                        cellId: cell.id,
                    };

                    // Получаем обновленный layout после изменения текущего элемента
                    const updatedPresentation = usePresentationStore.getState().getPresentation(presentationId);
                    const updatedSlide = updatedPresentation?.slides.find(s => s.id === slideId);
                    const updatedLayout = updatedSlide?.layouts.find(l => l.id === layoutId);
                    if (!updatedLayout) {
                        useHistoryStore.getState().commitTransaction(presentationId);
                        return;
                    }

                    const updatedElements = [...updatedLayout.elements];
                    const updatedElementIndex = updatedElements.findIndex(e => e.id === elementId);

                    // Вставляем новые элементы после текущего
                    updatedElements.splice(updatedElementIndex + 1, 0, emptyTextElement, afterListElement);

                    updatedLayout.elements = updatedElements;
                    usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
                    useHistoryStore.getState().commitTransaction(presentationId);

                    setTimeout(() => {
                        tiptapRefs.current?.editors[emptyTextElement.id]?.editor.commands.focus('start');
                    }, 10);

                    return;
                } else if (isListEnd) {
                    useHistoryStore.getState().beginTransaction(presentationId, 'end list in cell');

                    // 1. Обновляем текущий элемент с контентом списка
                    usePresentationStore.getState().updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: {
                            content: contentBeforeCursor!,
                        },
                        createHistoryEntry: true,
                        isTextElement: true,
                    });

                    // 2. Создаем пустой текстовый элемент
                    const emptyTextElement = {
                        ...getNewEditorElement('<p><span class="body-text normal-text"></span></p>', {}),
                        cellId: cell.id,
                    };

                    // Получаем обновленный layout после изменения текущего элемента
                    const updatedPresentation = usePresentationStore.getState().getPresentation(presentationId);
                    const updatedSlide = updatedPresentation?.slides.find(s => s.id === slideId);
                    const updatedLayout = updatedSlide?.layouts.find(l => l.id === layoutId);
                    if (!updatedLayout) {
                        useHistoryStore.getState().commitTransaction(presentationId);
                        return;
                    }

                    const updatedElements = [...updatedLayout.elements];
                    const updatedElementIndex = updatedElements.findIndex(e => e.id === elementId);

                    updatedElements.splice(updatedElementIndex + 1, 0, emptyTextElement);

                    updatedLayout.elements = updatedElements;
                    usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
                    useHistoryStore.getState().commitTransaction(presentationId);

                    setTimeout(() => {
                        tiptapRefs.current?.editors[emptyTextElement.id]?.editor.commands.focus('start');
                    }, 10);

                    return;
                } else if (isListStart) {
                    useHistoryStore.getState().beginTransaction(presentationId, 'start list in cell');

                    // 1. Обновляем текущий элемент как пустой текст
                    usePresentationStore.getState().updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: {
                            content: '<p><span class="body-text normal-text"></span></p>',
                        },
                        createHistoryEntry: true,
                        isTextElement: true,
                    });

                    // 2. Создаем элемент со списком после
                    const afterListElement = {
                        ...getNewEditorElement(contentAfterCursor!, {}),
                        cellId: cell.id,
                    };

                    // Получаем обновленный layout после изменения текущего элемента
                    const updatedPresentation = usePresentationStore.getState().getPresentation(presentationId);
                    const updatedSlide = updatedPresentation?.slides.find(s => s.id === slideId);
                    const updatedLayout = updatedSlide?.layouts.find(l => l.id === layoutId);
                    if (!updatedLayout) {
                        useHistoryStore.getState().commitTransaction(presentationId);
                        return;
                    }

                    const updatedElements = [...updatedLayout.elements];
                    const updatedElementIndex = updatedElements.findIndex(e => e.id === elementId);

                    updatedElements.splice(updatedElementIndex + 1, 0, afterListElement);

                    updatedLayout.elements = updatedElements;
                    usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
                    useHistoryStore.getState().commitTransaction(presentationId);

                    setTimeout(() => {
                        tiptapRefs.current?.editors[elementId]?.editor.commands.focus('start');
                    }, 10);

                    return;
                }

                // Если не разделение списка, продолжаем обычную логику
            }

            // Обрабатываем пустой contentAfterCursor
            if (!contentAfterCursor || contentAfterCursor.trim() === '' || contentAfterCursor.trim() === '<p></p>') {
                contentAfterCursor = '<p><span class="body-text normal-text"></span></p>';
            }

            // в строке 1 элемент. создаем новую строку
            if (row!.cells.length === 1) {
                // Instead of adding a new row to the grid structure, we'll add a new block layout
                // Create a new layout with a grid that has 1 row and the same number of columns as the current layout
                useHistoryStore.getState().beginTransaction(presentationId, 'create new layout');

                const defaultGridType = 'blank';
                const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

                // 1. Обновляем текущий элемент с контентом до
                usePresentationStore.getState().updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: {
                        content: contentBeforeCursor || '<p><span class="body-text normal-text"></span></p>',
                    },
                    createHistoryEntry: true,
                    isTextElement: true,
                });

                // 2. Создаем новый layout с элементом после
                const newLayoutId = generateId(8);
                const newElement = {
                    ...getNewEditorElement(contentAfterCursor, { preservedStyles }),
                    cellId: defaultLayoutGridStructure.rows[0].cells[0].id,
                };

                const firstNewEditorId = newElement.id;
                const newLayout: Layout = {
                    id: newLayoutId,
                    gridStructure: defaultLayoutGridStructure,
                    type: defaultGridType,
                    style: {},
                    elements: [newElement],
                };

                // Получаем обновленный slide после изменения текущего элемента
                const updatedPresentation = usePresentationStore.getState().getPresentation(presentationId);
                const updatedSlide = updatedPresentation?.slides.find(s => s.id === slideId);
                if (!updatedSlide) {
                    useHistoryStore.getState().commitTransaction(presentationId);
                    return;
                }

                // Add the new layout to the slide
                const updatedLayouts = [...updatedSlide.layouts];
                const currentLayoutIndex = updatedLayouts.findIndex(l => l.id === layoutId);
                updatedLayouts.splice(currentLayoutIndex + 1, 0, newLayout);

                // Update the slide with the new layouts
                usePresentationStore.getState().updateSlide(
                    presentationId,
                    slideId,
                    {
                        layouts: updatedLayouts,
                    },
                    true
                );

                useHistoryStore.getState().commitTransaction(presentationId);

                setTimeout(() => {
                    tiptapRefs.current?.editors[firstNewEditorId]?.editor.commands.focus('start');
                }, 10);
            } else {
                // в строке больше 1 элемента. просто добавляем новый элемент
                useHistoryStore.getState().beginTransaction(presentationId, 'add element in cell');

                const cell = row?.cells.find(c => c.id === cellId);
                if (!cell) {
                    useHistoryStore.getState().commitTransaction(presentationId);
                    return;
                }

                // 1. Обновляем текущий элемент с контентом до
                usePresentationStore.getState().updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: {
                        content: contentBeforeCursor || '<p><span class="body-text normal-text"></span></p>',
                    },
                    createHistoryEntry: true,
                    isTextElement: true,
                });

                // 2. Создаем новый элемент
                const newElement = {
                    ...getNewEditorElement(contentAfterCursor, { preservedStyles }),
                    cellId: cell.id,
                };

                // Получаем обновленный layout после изменения текущего элемента
                const updatedPresentation = usePresentationStore.getState().getPresentation(presentationId);
                const updatedSlide = updatedPresentation?.slides.find(s => s.id === slideId);
                const updatedLayout = updatedSlide?.layouts.find(l => l.id === layoutId);
                if (!updatedLayout) {
                    useHistoryStore.getState().commitTransaction(presentationId);
                    return;
                }

                const newElementIndex = updatedLayout.elements.findIndex(e => e.id === elementId);
                const updatedElements = [...updatedLayout.elements];
                updatedElements.splice(newElementIndex + 1, 0, newElement);

                updatedLayout.elements = updatedElements;

                usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);

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
                useHistoryStore.getState().commitTransaction(presentationId);
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
        (elementId: string, menuItem: MenuItem) => {
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

                    const content = (elementData as EditorElement).content
                        ? (elementData as EditorElement).content
                        : '';

                    usePresentationStore.getState().updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: {
                            ...newElementWithCell,
                            content,
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

    const memoizedOnAddElement = useMemo(
        () => (menuItem: MenuItem) => handleAddElement(elementId, menuItem),
        [handleAddElement, elementId]
    );

    const handleBackspacePressed = useCallback(
        (isEmpty: boolean, _textContent: string) => {
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

            // Check if this is the last element in the slide
            const isLastElementInSlide = slide.layouts.reduce((total, l) => total + l.elements.length, 0) === 1;
            if (isEmpty && isLastElementInSlide) {
                // If it's the last element and empty, do nothing
                return;
            }

            const layoutIndex = slide.layouts.findIndex(l => l.id === layoutId);
            const isMultiCellRow = layout.gridStructure.rows[0].cells.length > 1;

            // Helper function to check if an element has a text editor
            const hasTextEditor = (element: any) => {
                const config = getElementConfig(element.elementTypeId);
                return config?.hasTextEditor || false;
            };

            // If empty and not the last element, check what to do
            if (isEmpty) {
                if (isMultiCellRow) {
                    if (elementsInCell.length === 1) {
                        return;
                    }

                    let previousElement;
                    const currentElementIndexInCell = elementsInCell.findIndex(e => e.id === elementId);
                    if (currentElementIndexInCell > 0) {
                        previousElement = elementsInCell[currentElementIndexInCell - 1];
                    }

                    const updatedLayout = { ...layout };
                    const updatedElements = updatedLayout.elements.filter(e => e.id !== elementId);
                    updatedLayout.elements = updatedElements;

                    usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);

                    if (previousElement) {
                        tiptapRefs.current?.editors[previousElement.id]?.editor.commands.focus('end');
                    }
                } else {
                    // Handle single-cell row case - check previous layout
                    if (layoutIndex > 0) {
                        const previousLayout = slide.layouts[layoutIndex - 1];
                        const previousLayoutHasOneCell = previousLayout.gridStructure.rows[0].cells.length === 1;

                        if (previousLayoutHasOneCell) {
                            const previousElement = previousLayout.elements[previousLayout.elements.length - 1];
                            const previousElementHasTextEditor = hasTextEditor(previousElement);

                            if (previousElementHasTextEditor) {
                                // Move content from current editor to the end of previous text editor
                                const editorInPreviousLayout = tiptapRefs.current?.editors[previousElement.id];
                                const currentEditor = tiptapRefs.current?.editors[elementId];

                                if (editorInPreviousLayout && currentEditor) {
                                    // Get the text content from current editor to merge
                                    const currentTextContent = currentEditor.editor.getText();

                                    useHistoryStore.getState().beginTransaction(presentationId, 'merge content');

                                    // Insert the text content at the end of previous editor
                                    editorInPreviousLayout.editor
                                        .chain()
                                        .setMeta('transaction', true)
                                        .focus('end')
                                        .insertContent(currentTextContent)
                                        .run();

                                    // Delete current element and layout
                                    // usePresentationStore
                                    //     .getState()
                                    //     .deleteElement(presentationId, slideId, layoutId, elementId);
                                    usePresentationStore
                                        .getState()
                                        .deleteLayout(presentationId, slideId, layoutId, true);

                                    useHistoryStore.getState().commitTransaction(presentationId);

                                    setTimeout(() => {
                                        editorInPreviousLayout.editor.commands.focus('end');
                                    }, 10);
                                } else {
                                    console.warn(
                                        `Editor instance ${previousElement.id} or ${elementId} not found in tiptapRefs. Cannot merge content programmatically.`
                                    );
                                }
                            } else {
                                usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
                                return;
                            }
                        } else {
                            // Previous layout has more than 1 cell, do nothing
                            return;
                        }
                    } else {
                        // This is the first layout, just delete the element
                        usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);
                    }
                }
                return;
            }

            // Rest of the existing logic for non-empty elements
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
                    useHistoryStore.getState().commitTransaction(presentationId);
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
                slide.layouts.length > 1
            ) {
                // Check if current element is the only element in cell and layout
                const previousLayout = slide.layouts[layoutIndex - 1];
                const previousLayoutHasOneCell = previousLayout.gridStructure.rows[0].cells.length === 1;

                if (previousLayoutHasOneCell) {
                    const previousElement = previousLayout.elements[previousLayout.elements.length - 1];
                    const previousElementHasTextEditor = hasTextEditor(previousElement);
                    const currentElementHasTextEditor = hasTextEditor(layout.elements.find(e => e.id === elementId));

                    if (previousElementHasTextEditor && currentElementHasTextEditor) {
                        // Move content from current editor to the end of previous text editor
                        const editorInPreviousLayout = tiptapRefs.current?.editors[previousElement.id];
                        const currentEditor = tiptapRefs.current?.editors[elementId];

                        if (editorInPreviousLayout && currentEditor) {
                            const oldContentSize = editorInPreviousLayout.editor.state.doc.content.size - 1;

                            // Get the HTML content from current editor to merge (preserve structure)
                            const currentHtmlContent = currentEditor.editor.getHTML();
                            // Convert lists to flat paragraphs to avoid extra empty lines
                            const flatHtmlContent = convertListsToFlatParagraphs(currentHtmlContent);

                            useHistoryStore.getState().beginTransaction(presentationId, 'merge content');
                            // Insert the HTML content at the end of previous editor
                            editorInPreviousLayout.editor
                                .chain()
                                .setMeta('transaction', true)
                                .focus('end')
                                .insertContent(flatHtmlContent)
                                .run();

                            // Delete current element and layout
                            // usePresentationStore
                            //     .getState()
                            //     .deleteElement(presentationId, slideId, layoutId, elementId, true);
                            usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId, true);

                            useHistoryStore.getState().commitTransaction(presentationId);

                            setTimeout(() => {
                                const updatedEditor = tiptapRefs.current?.editors[previousElement.id];
                                updatedEditor?.editor.commands.focus(oldContentSize);
                            }, 10);
                        } else {
                            console.warn(
                                `Editor instance ${previousElement.id} or ${elementId} not found in tiptapRefs. Cannot merge content programmatically.`
                            );
                        }
                    } else if (currentElementHasTextEditor) {
                        // Current element has text editor but previous doesn't, just delete current element
                        usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);
                    } else {
                        // Neither has text editor, delete current layout
                        usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
                    }
                } else {
                    // Previous layout has more than 1 cell, delete current layout
                    usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
                }
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
                    const previousElementHasTextEditor = hasTextEditor(previousElement);
                    const currentElementHasTextEditor = hasTextEditor(layout.elements.find(e => e.id === elementId));

                    if (previousElementHasTextEditor && currentElementHasTextEditor) {
                        const editorToUpdate = tiptapRefs.current?.editors[previousElement.id];
                        const currentEditor = tiptapRefs.current?.editors[elementId];

                        if (editorToUpdate && currentEditor) {
                            const oldContentSize = editorToUpdate.editor.state.doc.content.size - 1;

                            // Get the HTML content from current editor to merge (preserve structure)
                            const currentHtmlContent = currentEditor.editor.getHTML();
                            // Convert lists to flat paragraphs to avoid extra empty lines
                            const flatHtmlContent = convertListsToFlatParagraphs(currentHtmlContent);

                            useHistoryStore.getState().beginTransaction(presentationId, 'merge content');
                            // Insert the HTML content at the end of previous editor
                            editorToUpdate.editor
                                .chain()
                                .setMeta('transaction', true)
                                .focus('end')
                                .insertContent(flatHtmlContent)
                                .run();

                            usePresentationStore
                                .getState()
                                .deleteElement(presentationId, slideId, layoutId, elementId, true);
                            useHistoryStore.getState().commitTransaction(presentationId);

                            setTimeout(() => {
                                const updatedEditor = tiptapRefs.current?.editors[previousElement.id];
                                updatedEditor?.editor.commands.focus(oldContentSize);
                            }, 10);
                        } else {
                            console.warn(
                                `Editor instance ${previousElement.id} or ${elementId} not found in tiptapRefs. Cannot merge content programmatically.`
                            );
                        }
                    } else {
                        // If previous element doesn't have text editor, just delete current element
                        const updatedLayout = { ...layout };
                        const updatedElements = updatedLayout.elements.filter(e => e.id !== elementId);
                        updatedLayout.elements = updatedElements;
                        usePresentationStore.getState().updateLayout(presentationId, slideId, layoutId, updatedLayout);
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
                    const previousElementHasTextEditor = hasTextEditor(elementInPreviousLayout);
                    const currentElementHasTextEditor = hasTextEditor(layout.elements.find(e => e.id === elementId));

                    if (previousElementHasTextEditor && currentElementHasTextEditor) {
                        const editorToUpdate = tiptapRefs.current?.editors[elementInPreviousLayout.id];
                        const currentEditor = tiptapRefs.current?.editors[elementId];

                        if (editorToUpdate && currentEditor) {
                            const oldContentSize = editorToUpdate.editor.state.doc.content.size - 1;

                            // Get the HTML content from current editor to merge (preserve structure)
                            const currentHtmlContent = currentEditor.editor.getHTML();
                            // Convert lists to flat paragraphs to avoid extra empty lines
                            const flatHtmlContent = convertListsToFlatParagraphs(currentHtmlContent);

                            useHistoryStore.getState().beginTransaction(presentationId, 'merge content');
                            // Insert the HTML content at the end of previous editor
                            editorToUpdate.editor
                                .chain()
                                .setMeta('transaction', true)
                                .focus('end')
                                .insertContent(flatHtmlContent)
                                .run();

                            usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId, true);

                            useHistoryStore.getState().commitTransaction(presentationId);

                            setTimeout(() => {
                                const updatedEditor = tiptapRefs.current?.editors[elementInPreviousLayout.id];
                                updatedEditor?.editor.commands.focus(oldContentSize);
                            }, 10);
                        } else {
                            console.warn(
                                `Editor instance ${elementInPreviousLayout.id} or ${elementId} not found in tiptapRefs. Cannot merge content programmatically.`
                            );
                        }
                    } else {
                        // If previous element doesn't have text editor, just delete current layout
                        usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
                    }
                }
            }
        },
        [presentationId, slideId, layoutId, cellId, elementId, tiptapRefs, isInTable]
    );

    const handleDeletePressed = useCallback(
        (isEmpty: boolean, _textContent: string) => {
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

            // Check if this is the last element in the slide
            const isLastElementInSlide = slide.layouts.reduce((total, l) => total + l.elements.length, 0) === 1;
            // If it's empty and the last element, do nothing
            if (isEmpty && isLastElementInSlide) {
                return;
            }

            // If it's empty but not the last element, delete it
            if (isEmpty) {
                usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);
                return;
            }

            // Helper function to check if an element has a text editor
            const hasTextEditor = (element: any) => {
                const config = getElementConfig(element.elementTypeId);
                return config?.hasTextEditor || false;
            };

            // Handle Delete at the end of non-empty element - merge with next element
            const layoutIndex = slide.layouts.findIndex(l => l.id === layoutId);
            const isMultiCellRow = layout.gridStructure.rows[0].cells.length > 1;

            if (isMultiCellRow) {
                // In multi-cell row, merge with next element in the same cell
                const currentElementIndexInCell = elementsInCell.findIndex(e => e.id === elementId);

                if (currentElementIndexInCell < elementsInCell.length - 1) {
                    const nextElement = elementsInCell[currentElementIndexInCell + 1];
                    const nextElementHasTextEditor = hasTextEditor(nextElement);
                    const currentElementHasTextEditor = hasTextEditor(layout.elements.find(e => e.id === elementId));

                    if (currentElementHasTextEditor && nextElementHasTextEditor) {
                        const currentEditor = tiptapRefs.current?.editors[elementId];
                        const nextEditor = tiptapRefs.current?.editors[nextElement.id];

                        if (currentEditor && nextEditor) {
                            // Get the text content from next editor to merge
                            const nextTextContent = nextEditor.editor.getText();

                            useHistoryStore.getState().beginTransaction(presentationId, 'merge content');

                            // Insert the text content at the end of current editor
                            currentEditor.editor
                                .chain()
                                .setMeta('transaction', true)
                                .focus('end')
                                .insertContent(nextTextContent)
                                .run();

                            // Delete next element
                            usePresentationStore
                                .getState()
                                .deleteElement(presentationId, slideId, layoutId, nextElement.id, true);

                            useHistoryStore.getState().commitTransaction(presentationId);

                            setTimeout(() => {
                                currentEditor.editor.commands.focus('end');
                            }, 10);
                        } else {
                            console.warn(
                                `Editor instance ${elementId} or ${nextElement.id} not found in tiptapRefs. Cannot merge content programmatically.`
                            );
                        }
                    }
                }
            } else {
                // Single-cell row - check if there are more elements in the same cell or need to check next layout
                const currentElementIndexInCell = elementsInCell.findIndex(e => e.id === elementId);

                if (currentElementIndexInCell < elementsInCell.length - 1) {
                    // There are more elements in the same cell
                    const nextElement = elementsInCell[currentElementIndexInCell + 1];
                    const nextElementHasTextEditor = hasTextEditor(nextElement);
                    const currentElementHasTextEditor = hasTextEditor(layout.elements.find(e => e.id === elementId));

                    if (currentElementHasTextEditor && nextElementHasTextEditor) {
                        const currentEditor = tiptapRefs.current?.editors[elementId];
                        const nextEditor = tiptapRefs.current?.editors[nextElement.id];

                        if (currentEditor && nextEditor) {
                            const nextTextContent = nextEditor.editor.getText();

                            useHistoryStore.getState().beginTransaction(presentationId, 'merge content');

                            currentEditor.editor
                                .chain()
                                .setMeta('transaction', true)
                                // .focus('end')
                                .insertContent(nextTextContent)
                                .run();

                            usePresentationStore
                                .getState()
                                .deleteElement(presentationId, slideId, layoutId, nextElement.id, true);

                            useHistoryStore.getState().commitTransaction(presentationId);

                            // setTimeout(() => {
                            //     currentEditor.editor.commands.focus('end');
                            // }, 10);
                        } else {
                            console.warn(
                                `Editor instance ${elementId} or ${nextElement.id} not found in tiptapRefs. Cannot merge content programmatically.`
                            );
                        }
                    }
                } else if (layoutIndex < slide.layouts.length - 1) {
                    // This is the last element in the current cell/layout, check next layout
                    const nextLayout = slide.layouts[layoutIndex + 1];
                    const nextLayoutHasOneCell = nextLayout.gridStructure.rows[0].cells.length === 1;

                    if (nextLayoutHasOneCell && nextLayout.elements.length > 0) {
                        const nextElement = nextLayout.elements[0];
                        const nextElementHasTextEditor = hasTextEditor(nextElement);
                        const currentElementHasTextEditor = hasTextEditor(
                            layout.elements.find(e => e.id === elementId)
                        );

                        if (currentElementHasTextEditor && nextElementHasTextEditor) {
                            const currentEditor = tiptapRefs.current?.editors[elementId];
                            const nextEditor = tiptapRefs.current?.editors[nextElement.id];

                            if (currentEditor && nextEditor) {
                                const nextTextContent = nextEditor.editor.getText();

                                useHistoryStore.getState().beginTransaction(presentationId, 'merge content');

                                currentEditor.editor
                                    .chain()
                                    .setMeta('transaction', true)
                                    .focus('end')
                                    .insertContent(nextTextContent)
                                    .focus(currentEditor.editor.state.doc.content.size - 1)
                                    .run();

                                // Delete next layout if it only has one element
                                if (nextLayout.elements.length === 1) {
                                    usePresentationStore
                                        .getState()
                                        .deleteLayout(presentationId, slideId, nextLayout.id, true);
                                } else {
                                    // Delete only the first element from next layout
                                    usePresentationStore
                                        .getState()
                                        .deleteElement(presentationId, slideId, nextLayout.id, nextElement.id, true);
                                }

                                useHistoryStore.getState().commitTransaction(presentationId);

                                // setTimeout(() => {
                                //     currentEditor.editor.commands.focus('end');
                                // }, 10);
                            } else {
                                console.warn(
                                    `Editor instance ${elementId} or ${nextElement.id} not found in tiptapRefs. Cannot merge content programmatically.`
                                );
                            }
                        }
                    }
                }
            }
        },
        [presentationId, slideId, layoutId, cellId, elementId, tiptapRefs, isInTable]
    );

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
                        onDeletePressed={handleDeletePressed}
                        onContentChange={handleEditorContentChange}
                        // onBlur={handleBlur}
                        customBubbleMenuTrigger={dragHandleRef}
                        onAddElement={memoizedOnAddElement}
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
                        isWidthRightMenu={true}
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
            } else if (elementTypeId === ElementType.BUTTON) {
                return (
                    <Buttons
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
                        slideBackground={slideBackground}
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
            handleDeletePressed,
            handleEditorContentChange,
            dragHandleRef,
            memoizedOnAddElement,
            presentationId,
            slideId,
            layoutId,
            isReadOnly,
            hasMultipleCells,
            slideBackground,
        ]
    );

    if (!elementConfig) {
        return <div>Element config not found {elementTypeId}</div>;
    }
    return (
        <div
            key={elementId}
            className={`${styles.elementContent} ${isElementSelected ? styles.elementContentSelected : ''}`}
            data-element-id={elementId}
            {...(isElementSelected ? { 'data-element-selected': true } : {})}
            style={{
                fontSize: 'var(--font-size)',
            }}
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
            onClick={() => {
                useUIStateStore.getState().setSelectedData({
                    elementId,
                    elementType: elementTypeId,
                    layoutId,
                    cellId,
                });
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
                            ariaLabel="Перетащить этот элемент"
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

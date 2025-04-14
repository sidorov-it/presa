import React, { useEffect, useState, useMemo, useCallback, MutableRefObject } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { getElementMenuComponent } from '@/elements/registry';
import LayoutMenu from './LayoutMenu';
import {
    DuplicateIcon,
    DeleteIcon,
    EditIcon,
    AddColumnLeftIcon,
    AddColumnRightIcon,
    AlignTopIcon,
    AlignCenterIcon,
    AlignBottomIcon,
    MergeIcon
} from '@/components/icons';
import RowTableMenu from './RowTableMenu/RowTableMenu';
import ColumnTableMenu from './ColumnTableMenu/ColumnTableMenu';
import { useMenuIsOpen, useMenuStore, useMenuSelectedColumn, useMenuSelectedElement, useMenuSelectedLayout, useMenuSelectedSlide, useMenuSelectedCell } from '@/store/menuStore';
import { usePresentationStore } from '@/store/presentationStore';
import { TipTapRefs } from '@/types';
import TableMenu from './TableMenu/TableMenu';
import { BaseMenu, MenuItem } from './BaseMenu';

const SlideMenu: React.FC<{ tiptapRefs: MutableRefObject<TipTapRefs> }> = ({ tiptapRefs }) => {
    const {
        duplicateSlide,
        deleteSlide,
        duplicateElement,
        deleteElement,
        editElement,
        getElement,
        addColumnLeft,
        addColumnRight,
        duplicateColumn,
        alignColumnTop,
        alignColumnCenter,
        alignColumnBottom,
        deleteColumn,
        getCell,
        getSlide,
        mergeSlideWithPrevious,
    } = useMenuStore();

    const { activeEditor } = useEditorStore();

    const [isTable, setIsTable] = useState(false);

    const slideId = useMenuSelectedSlide();
    const layoutId = useMenuSelectedLayout();
    const columnId = useMenuSelectedColumn();
    const cellId = useMenuSelectedCell();
    const elementId = useMenuSelectedElement();
    const presentationId = useMenuStore(state => state.presentationId);
    const presentation = usePresentationStore(state => state.getPresentation(presentationId ?? ''));
    const elementType = useMenuStore(state => state.elementType);
    const isOpen = useMenuIsOpen();

    const isTextEditor = useMenuStore(state => state.isTextEditor);
    const tableRowIndex = useMenuStore(state => state.tableRowIndex);
    const tableColumnIndex = useMenuStore(state => state.tableColumnIndex);

    const cell = getCell(slideId, layoutId, cellId);
    const element = getElement(slideId, layoutId, elementId);

    useEffect(() => {
        if (!presentationId || !slideId || !layoutId) return;

        const layout = usePresentationStore.getState().getLayout(presentationId, slideId, layoutId);

        if (isTable !== layout?.isTable) {
            setIsTable(layout?.isTable ?? false);
        }
    }, [layoutId, isTable]);

    let slideIndex = 0;
    if (elementType === 'slide') {
        const slide = getSlide(slideId);
        if (slide) {
            slideIndex = presentation?.slides.findIndex((s) => s.id === slide.id) ?? 0;
        }
    }

    const {
        MenuComponent,
    } = useMemo(() => {
        if (element?.elementTypeId) {
            return getElementMenuComponent(element.elementTypeId)
        }
        return {
            MenuComponent: null,
            menuDirection: 'bottom',
            menuHeight: undefined
        };
    }, [element?.elementTypeId]);

    const [position, setPosition] = useState<{ x: number; y: number; rect: DOMRect } | null>(null);

    useEffect(() => {
        if (slideId && isOpen) {
            const slide = document.querySelector(`[data-slide-id="${slideId}"]`);

            if (!slide) return;

            let dragElement = null;

            // Find the appropriate drag handle based on element type
            if (elementType === 'row') {
                dragElement = slide.querySelector(`[data-row-drag-handle="${layoutId}-${tableRowIndex}"]`);
            } else if (elementType === 'column') {
                dragElement = slide.querySelector(`[data-column-drag-handle="${layoutId}-${tableColumnIndex}"]`);
            } else if (elementType === 'element' && elementId) {
                dragElement = slide.querySelector(`[data-element-drag-handle="${elementId}"]`);
            } else if (elementType === 'cell') {
                dragElement = slide.querySelector(`[data-cell-drag-handle="${cell?.id}"]`);
            } else if (elementType === 'layout' && layoutId) {
                dragElement = slide.querySelector(`[data-layout-drag-handle="${layoutId}"]`);
            } else if (elementType === 'slide') {
                dragElement = document.querySelector(`[data-slide-drag-handle="${slideId}"]`);
            }

            if (!dragElement) {
                dragElement = document.querySelector(`[data-slide-drag-handle="${slideId}"]`);
            }

            if (dragElement) {
                const rect = dragElement.getBoundingClientRect();
                setPosition({ x: rect.left, y: rect.top + window.scrollY, rect: rect });
            }
        }

        return () => {
            setPosition(null);
        };
    }, [isOpen, slideId, elementId, elementType, layoutId, columnId, tableRowIndex, tableColumnIndex, cell]);

    const handleAddColumnLeft = useCallback(() => {
        if (Number.isInteger(tableColumnIndex)) {
            addColumnLeft(tableColumnIndex!);
            useMenuStore.getState().closeMenu();
        }
    }, [tableColumnIndex, addColumnLeft]);

    const handleAddColumnRight = useCallback(() => {
        if (Number.isInteger(tableColumnIndex)) {
            addColumnRight(tableColumnIndex!);
            useMenuStore.getState().closeMenu();
        }
    }, [tableColumnIndex, addColumnRight]);

    const handleDuplicateColumn = useCallback(() => {
        duplicateColumn();
        useMenuStore.getState().closeMenu();
    }, [duplicateColumn]);

    const handleAlignColumnTop = useCallback(() => {
        alignColumnTop();
        useMenuStore.getState().closeMenu();
    }, [alignColumnTop]);

    const handleAlignColumnCenter = useCallback(() => {
        alignColumnCenter();
        useMenuStore.getState().closeMenu();
    }, [alignColumnCenter]);

    const handleAlignColumnBottom = useCallback(() => {
        alignColumnBottom();
        useMenuStore.getState().closeMenu();
    }, [alignColumnBottom]);

    const handleDeleteColumn = useCallback(() => {
        deleteColumn();
        useMenuStore.getState().closeMenu();
    }, [deleteColumn]);

    const handleMergeSlide = useCallback(() => {
        if (slideId) {
            mergeSlideWithPrevious();
            useMenuStore.getState().closeMenu();
        }
    }, [slideId, mergeSlideWithPrevious]);

    // Render different menu items based on element type
    const renderMenuItems = () => {
        switch (elementType) {
            case 'element':
                return (
                    <>
                        <MenuItem
                            icon={<EditIcon />}
                            label="Edit"
                            onClick={editElement}
                        />
                        <MenuItem
                            icon={<DuplicateIcon />}
                            label="Duplicate"
                            onClick={duplicateElement}
                        />
                        <MenuItem
                            icon={<DeleteIcon />}
                            label="Delete"
                            onClick={deleteElement}
                            color="#f00"
                        />
                    </>
                );
            case 'cell':
                return (
                    <>
                        <MenuItem
                            icon={<AddColumnLeftIcon />}
                            label="Add column left"
                            onClick={handleAddColumnLeft}
                        />
                        <MenuItem
                            icon={<AddColumnRightIcon />}
                            label="Add column right"
                            onClick={handleAddColumnRight}
                        />
                        <MenuItem
                            icon={<DuplicateIcon />}
                            label="Duplicate"
                            onClick={handleDuplicateColumn}
                        />
                        <MenuItem
                            icon={<AlignTopIcon />}
                            label="Align top"
                            onClick={handleAlignColumnTop}
                            active={cell?.alignment === 'top'}
                        />
                        <MenuItem
                            icon={<AlignCenterIcon />}
                            label="Align center"
                            onClick={handleAlignColumnCenter}
                            active={cell?.alignment === 'center'}
                        />
                        <MenuItem
                            icon={<AlignBottomIcon />}
                            label="Align bottom"
                            onClick={handleAlignColumnBottom}
                            active={cell?.alignment === 'bottom'}
                        />
                        <MenuItem
                            icon={<DeleteIcon />}
                            label="Delete column"
                            onClick={handleDeleteColumn}
                            color="#f00"
                        />
                    </>
                );
            case 'slide':
                return (
                    <>
                        <MenuItem
                            icon={<DuplicateIcon />}
                            label="Duplicate"
                            onClick={duplicateSlide}
                        />
                        {slideIndex > 0 && (
                            <MenuItem
                                icon={<MergeIcon />}
                                label="Merge"
                                onClick={handleMergeSlide}
                            />
                        )}
                        <MenuItem
                            icon={<DeleteIcon />}
                            label="Delete"
                            onClick={deleteSlide}
                            color="#f00"
                        />
                    </>
                );
            case 'row':
                return (
                    <RowTableMenu
                        elementId={elementId ?? undefined}
                        tableRowIndex={tableRowIndex ?? undefined}
                        tiptapRefs={tiptapRefs}
                    />
                );
            case 'column':
                return (
                    <ColumnTableMenu
                        elementId={elementId ?? undefined}
                        tableColumnIndex={tableColumnIndex ?? undefined}
                        tiptapRefs={tiptapRefs}
                    />
                );
            default:
                return null;
        }
    };

    if (!isOpen || !position) {
        return null;
    }

    if (isTextEditor) {
        return null;
    }

    if (elementType === 'layout' && layoutId && !isTable) {
        return <LayoutMenu position={position} layoutId={layoutId} />;
    } else if (isTable && elementType === 'layout') {
        return (
            <TableMenu
                position={position}
                layoutId={layoutId ?? undefined}
                presentationId={presentation!.id}
                slideId={slideId ?? undefined}
                tiptapRefs={tiptapRefs}
            />
        );
    }

    return (
        <BaseMenu position={position}>
            {MenuComponent ? (
                <MenuComponent
                    slideId={slideId}
                    layoutId={layoutId}
                    columnId={columnId}
                    elementId={elementId}
                    presentationId={presentation!.id}
                    editor={activeEditor}
                />
            ) : (
                renderMenuItems()
            )}
        </BaseMenu>
    );
};

export default SlideMenu;
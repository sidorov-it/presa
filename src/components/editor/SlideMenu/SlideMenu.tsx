import React, { useRef, useEffect, useState, CSSProperties, useMemo, useCallback, MutableRefObject } from 'react';
import styles from './SlideMenu.module.css';
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
// Define menu item types
interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
    active?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, className, active }) => (
    <li>
        <button
            className={`${styles.slideMenuButton} ${className || ''} ${active ? styles.active : ''}`}
            onClick={onClick}
            aria-label={label}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            title={label}
        >
            <div className="flex items-center justify-center">
                {icon}
            </div>
        </button>
    </li>
);

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

    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number; rect: DOMRect } | null>(null);

    // Custom light theme styles
    const lightThemeStyle = {
        backgroundColor: 'white',
        color: '#333',
        borderColor: '#e2e8f0',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    };

    // Close the menu when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                useMenuStore.getState().closeMenu();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

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
        if (slideId && layoutId) {
            addColumnLeft(slideId, layoutId, tableColumnIndex!);
            useMenuStore.getState().closeMenu();
        }
    }, [slideId, layoutId, tableColumnIndex, addColumnLeft]);

    const handleAddColumnRight = useCallback(() => {
        if (slideId && layoutId) {
            addColumnRight(slideId, layoutId, tableColumnIndex!);
            useMenuStore.getState().closeMenu();
        }
    }, [slideId, layoutId, tableColumnIndex, addColumnRight]);

    const handleDuplicateColumn = useCallback(() => {
        if (slideId && layoutId && columnId) {
            duplicateColumn(slideId, layoutId, columnId);
            useMenuStore.getState().closeMenu();
        }
    }, [slideId, layoutId, columnId, duplicateColumn]);

    const handleAlignColumnTop = useCallback(() => {
        if (slideId && layoutId && cellId) {
            alignColumnTop(slideId, layoutId, cellId);
            useMenuStore.getState().closeMenu();
        }
    }, [slideId, layoutId, cellId, alignColumnTop]);

    const handleAlignColumnCenter = useCallback(() => {
        if (slideId && layoutId && cellId) {
            alignColumnCenter(slideId, layoutId, cellId);
            useMenuStore.getState().closeMenu();
        }
    }, [slideId, layoutId, cellId, alignColumnCenter]);

    const handleAlignColumnBottom = useCallback(() => {
        if (slideId && layoutId && cellId) {
            alignColumnBottom(slideId, layoutId, cellId);
            useMenuStore.getState().closeMenu();
        }
    }, [slideId, layoutId, cellId, alignColumnBottom]);

    const handleDeleteColumn = useCallback(() => {
        if (slideId && layoutId && cellId) {
            deleteColumn(slideId, layoutId, cellId);
            useMenuStore.getState().closeMenu();
        }
    }, [slideId, layoutId, cellId, deleteColumn]);

    const handleMergeSlide = useCallback(() => {
        if (slideId) {
            mergeSlideWithPrevious();
            useMenuStore.getState().closeMenu();
        }
    }, [slideId, mergeSlideWithPrevious]);

    const getMenuPosition = useCallback(() => {
        if (!position) return { left: 0, top: 0 };

        const menuWidth = 250; // Estimated menu width
        const defaultMenuHeight = 46; // Estimated menu height

        let left = position.x;
        const top = position.y - defaultMenuHeight - 5;

        // Check right edge
        if (left + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 10;
        }

        return { left, top };
    }, [position]);

    if (!isOpen || !position) {
        return null;
    }

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
                            className={styles.removeButton}
                        />
                    </>
                );
            case 'cell':
                return (
                    <>
                        <MenuItem
                            icon={<AddColumnLeftIcon />}
                            label="Добавить столбец слева"
                            onClick={handleAddColumnLeft}
                        />
                        <MenuItem
                            icon={<AddColumnRightIcon />}
                            label="Добавить столбец справа"
                            onClick={handleAddColumnRight}
                        />
                        <MenuItem
                            icon={<DuplicateIcon />}
                            label="Дублировать"
                            onClick={handleDuplicateColumn}
                        />

                        <MenuItem
                            icon={<AlignTopIcon />}
                            label="Выровнять по верхнему краю"
                            active={cell?.alignment === 'top'}
                            onClick={handleAlignColumnTop}
                        />
                        <MenuItem
                            icon={<AlignCenterIcon />}
                            label="Выровнять по центру"
                            active={cell?.alignment === 'center'}
                            onClick={handleAlignColumnCenter}
                        />
                        <MenuItem
                            icon={<AlignBottomIcon />}
                            label="Выровнять по нижнему краю"
                            active={cell?.alignment === 'bottom'}
                            onClick={handleAlignColumnBottom}
                        />

                        <MenuItem
                            icon={<DeleteIcon />}
                            label="Удалить столбец"
                            onClick={handleDeleteColumn}
                            className={styles.removeButton}
                        />
                    </>
                );
            case 'layout':
                return (
                    <>
                        {/* <MenuItem
                            icon={<DuplicateIcon />}
                            label="Duplicate"
                            onClick={closeMenu}
                        />
                        <MenuItem
                            icon={<MoveIcon />}
                            label="Move"
                            onClick={closeMenu}
                        />
                        <MenuItem
                            icon={<DeleteIcon />}
                            label="Delete"
                            onClick={deleteLayout}
                            className={styles.removeButton}
                        /> */}
                        {/* <LayoutMenu position={position} /> */}
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
                            className={styles.removeButton}
                        />
                    </>
                );
            case 'row':
                return (
                    <>
                        <RowTableMenu
                            slideId={slideId ?? undefined}
                            layoutId={layoutId ?? undefined}
                            elementId={elementId ?? undefined}
                            presentationId={presentation!.id}
                            editor={activeEditor ?? undefined}
                            tableRowIndex={tableRowIndex ?? undefined}
                            tiptapRefs={tiptapRefs}
                        />
                    </>
                );
            case 'column':
                return (
                    <ColumnTableMenu
                        slideId={slideId ?? undefined}
                        layoutId={layoutId ?? undefined}
                        elementId={elementId ?? undefined}
                        presentationId={presentation!.id}
                        tableColumnIndex={tableColumnIndex ?? undefined}
                        tiptapRefs={tiptapRefs}
                    />
                );
            default:
                return null;
        }
    };

    // Calculate menu position so it doesn't go off-screen


    const menuPosition = getMenuPosition();
    const menuStyle = {
        position: 'absolute' as CSSProperties['position'],
        left: `${menuPosition.left}px`,
        top: `${menuPosition.top}px`,
        ...lightThemeStyle,  // Apply light theme styles inline
        zIndex: 1000,
    };

    if (isTextEditor) {
        return null;
    }

    if (elementType === 'layout' && layoutId && !isTable) {
        return <LayoutMenu position={position} layoutId={layoutId} />
    } else if (isTable) {
        return <TableMenu position={position} layoutId={layoutId} presentationId={presentation!.id} slideId={slideId} tiptapRefs={tiptapRefs} />
    }

    return (
        <div
            ref={menuRef}
            className={`${styles.slideMenu} light-theme-only`}
            style={menuStyle}
        >
            <ul className="flex items-center space-x-1">
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
            </ul>
        </div>
    );
};

export default SlideMenu;
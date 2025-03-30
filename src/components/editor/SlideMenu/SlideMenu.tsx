import React, { useRef, useEffect, useState } from 'react';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
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
        >
            <div className="flex items-center">
                <span className="mr-2">{icon}</span>
                <span>{label}</span>
            </div>
        </button>
    </li>
);

const SlideMenu: React.FC = () => {
    const {
        state,
        closeMenu,
        duplicateSlide,
        deleteSlide,
        duplicateElement,
        deleteElement,
        deleteLayout,
        editElement,

        addColumnLeft,
        addColumnRight,
        duplicateColumn,
        alignColumnTop,
        alignColumnCenter,
        alignColumnBottom,
        deleteColumn,
        getElement,
        getCell,
        getLayout,
        getSlide,
        getPresentation,
        mergeSlideWithPrevious,
    } = useSlideMenu();

    const { activeElementType, activeEditor } = useEditorStore();

    const presentation = getPresentation()
    const element = getElement(state.slideId, state.layoutId, state.elementId);
    const cell = getCell(state.slideId, state.layoutId, state.columnId);
    const layout = getLayout(state.slideId, state.layoutId);
    const slide = getSlide(state.slideId);
    
    let slideIndex = 0;
    if (state.elementType === 'slide') {
        const slide = getSlide(state.slideId);
        if (slide) {
            slideIndex = presentation?.slides.findIndex((s) => s.id === slide.id) ?? 0;
        }
    }

    const MenuComponent = activeElementType ? getElementMenuComponent(activeElementType) : null;

    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    // const activeEditor = useEditorStore((state) => state.activeEditor);

    
    // Close the menu when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };

        if (state.isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [state.isOpen, closeMenu]);

    useEffect(() => {
        if (state.slideId && state.isOpen) {
            const slide = document.querySelector(`[data-slide-id="${state.slideId}"]`);

            if (!slide) return;

            let dragElement = null;
            
            // Find the appropriate drag handle based on element type
            if (state.elementType === 'element' && state.elementId) {
                dragElement = slide.querySelector(`[data-element-drag-handle="${state.elementId}"]`);
            } else if (state.elementType === 'column' && state.columnId) {
                dragElement = slide.querySelector(`[data-column-drag-handle="${state.columnId}"]`);
            } else if (state.elementType === 'layout' && state.layoutId) {
                dragElement = slide.querySelector(`[data-layout-drag-handle="${state.layoutId}"]`);
            } else if (state.elementType === 'slide') {
                dragElement = document.querySelector(`[data-slide-drag-handle="${state.slideId}"]`);
            }
            
            if (!dragElement) {
                dragElement = document.querySelector(`[data-slide-drag-handle="${state.slideId}"]`);
            }
            
            if (dragElement) {
                const rect = dragElement.getBoundingClientRect();
                setPosition({ x: rect.left, y: rect.top + window.scrollY });
            }
        }

        return () => {
            setPosition(null);
        };
    }, [state.isOpen, state.slideId, state.elementId, state.elementType, state.layoutId, state.columnId]);

    const handleAddColumnLeft = () => {
        if (state.slideId && state.layoutId && state.columnId) {
            addColumnLeft(state.slideId, state.layoutId, state.columnId);
            closeMenu()
        }
    }

    const handleAddColumnRight = () => {
        if (state.slideId && state.layoutId && state.columnId) {
            addColumnRight(state.slideId, state.layoutId, state.columnId);
            closeMenu()
        }
    }

    const handleDuplicateColumn = () => {
        if (state.slideId && state.layoutId && state.columnId) {
            duplicateColumn(state.slideId, state.layoutId, state.columnId);
            closeMenu()
        }
    }

    const handleAlignColumnTop = () => {
        if (state.slideId && state.layoutId && state.columnId) {
            alignColumnTop(state.slideId, state.layoutId, state.columnId);
            closeMenu()
        }
    }

    const handleAlignColumnCenter = () => {
        if (state.slideId && state.layoutId && state.columnId) {
            alignColumnCenter(state.slideId, state.layoutId, state.columnId);
            closeMenu()
        }
    }

    const handleAlignColumnBottom = () => {
        if (state.slideId && state.layoutId && state.columnId) {
            alignColumnBottom(state.slideId, state.layoutId, state.columnId);
            closeMenu()
        }
    }

    const handleDeleteColumn = () => {
        if (state.slideId && state.layoutId && state.columnId) {
            deleteColumn(state.slideId, state.layoutId, state.columnId);
            closeMenu()
        }
    }

    const handleMergeSlide = () => {
        if (state.slideId) {
            mergeSlideWithPrevious();
            closeMenu();
        }
    }

    if (!state.isOpen || !position) {
        return null;
    }

    const menuStyle = {
        position: 'absolute' as const,
        left: `${position.x}px`,
        top: `${position.y + 40}px`,
        zIndex: 1000,
    };

    // Render different menu items based on element type
    const renderMenuItems = () => {
        switch (state.elementType) {
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
            case 'column':
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
            default:
                return null;
        }
    };

    if (state.isTextEditor) {
        return null;
    }

    if (state.elementType === 'layout' && state.layoutId) {
        return <LayoutMenu position={position} layoutId={state.layoutId} />
    }
    return (
        <div
            ref={menuRef}
            className={`${styles.slideMenu}`}
            style={menuStyle}
        >
            <ul className="divide-y divide-gray-100">
                {MenuComponent ? <MenuComponent
                    editor={activeEditor}
                /> : renderMenuItems()}
            </ul>
        </div>
    );
};

export default SlideMenu; 
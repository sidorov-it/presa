import React, { useRef, useEffect, useState } from 'react';
import { useSlideMenu, MenuElementType } from '@/contexts/SlideMenuContext';
import styles from './SlideMenu.module.css';
import { useEditorStore } from '@/store/editorStore';
import { getElementMenuComponent } from '@/elements/registry';
import { usePresentationStore } from '@/store/presentationStore';
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

// SVG Icons components
const DuplicateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const MoveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
);

const AddColumnLeftIcon = () => (
    <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="diagram-cells" className="svg-inline--fa fa-diagram-cells fa-fw fa-rotate-270 " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M448 224c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64l384 0zm16 128v64c0 8.8-7.2 16-16 16l-80 0H144 64c-8.8 0-16-7.2-16-16l0-64c0-8.8 7.2-16 16-16H448c8.8 0 16 7.2 16 16zm48 64V352c0-35.3-28.7-64-64-64L64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64z"></path></svg>
);

const AddColumnRightIcon = () => (
    <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="diagram-cells" className="svg-inline--fa fa-diagram-cells fa-fw fa-rotate-90 " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M448 224c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64l384 0zm16 128v64c0 8.8-7.2 16-16 16l-80 0H144 64c-8.8 0-16-7.2-16-16l0-64c0-8.8 7.2-16 16-16H448c8.8 0 16 7.2 16 16zm48 64V352c0-35.3-28.7-64-64-64L64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64z"></path></svg>
);

const AlignTopIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M8 11h3v10h2V11h3l-4-4-4 4zM4 3v2h16V3H4z"></path></svg>
)

const AlignCenterIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M8 19h3v4h2v-4h3l-4-4-4 4zm8-14h-3V1h-2v4H8l4 4 4-4zM4 11v2h16v-2H4z"></path></svg>
)

const AlignBottomIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z"></path></svg>
)

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
        getSlide
    } = useSlideMenu();

    const { activeElementType, activeEditor } = useEditorStore();

    const element = getElement(state.slideId, state.layoutId, state.elementId);
    const cell = getCell(state.slideId, state.layoutId, state.columnId);
    const layout = getLayout(state.slideId, state.layoutId);
    const slide = getSlide(state.slideId);
    
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
                        <MenuItem 
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
                        />
                    </>
                );
            case 'slide':
            default:
                return (
                    <>
                        <MenuItem 
                            icon={<DuplicateIcon />} 
                            label="Duplicate" 
                            onClick={duplicateSlide} 
                        />
                        <MenuItem 
                            icon={<DeleteIcon />} 
                            label="Delete" 
                            onClick={deleteSlide} 
                            className={styles.removeButton} 
                        />
                    </>
                );
        }
    };

    if (state.isTextEditor) {
        return null;
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
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useRef, useState } from 'react';
import DragHandler from '@/components/editor/DragHandler';
import { useUIStateStore } from '@/store/uiStateStore';
import styles from './ItemWrapper.module.css';
import { useDnd } from '@/contexts/DragDropContext';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

export default function ItemWrapper({
    children,
    itemId,
    slideId,
    className,
    layoutId,
    elementId,
    renderMenuComponent,
}: {
    children: React.ReactNode;
    presentationId: string;
    itemId: string;
    slideId: string;
    className?: string;
    layoutId: string;
    elementId: string;
    renderMenuComponent: (menuPosition: { x: number; y: number }) => React.ReactNode;
}) {
    const isReadOnly = useReadOnly();

    const [hovered, setHovered] = useState(false);
    const isSelected = useUIStateStore(state => state.selectedSmartLayoutItemId === itemId);
    const isMenuOpen = useUIStateStore(state => state.isContextMenuOpen && state.selectedSmartLayoutItemId === itemId);
    const itemRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const { handleDragStart } = useDnd();

    useEffect(() => {
        if (itemRef.current && isMenuOpen) {
            const clientRect = itemRef.current.getBoundingClientRect();
            setMenuPosition({ x: clientRect.left + clientRect.width / 2, y: clientRect.top + window.scrollY });
        } else if (!isMenuOpen) {
            setMenuPosition(null);
        }
    }, [itemRef, isMenuOpen]);

    const handleItemDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        // Use standard DnD structure but include smartLayoutItemId for identifying item within smartLayout
        handleDragStart(e, {
            elementId,
            layoutId,
            smartLayoutItemId: itemId,
            dragElementType: 'smart-layout-item',
        });

        // Create an invisible drag image
        // const emptyImage = new Image();
        // emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        // e.dataTransfer.setDragImage(emptyImage, 0, 0);
    };

    return (
        <div
            className={`${styles.container} ${className ? className : ''}`}
            ref={itemRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => {
                if (!isReadOnly) {
                    useUIStateStore.getState().setSelectedSmartLayoutItemId(layoutId, elementId, itemId);
                }
            }}
            data-smart-layout-item-id={itemId}
        >
            {!isReadOnly && (hovered || isSelected) && (
                <DragHandler
                    className={styles.dragHandler}
                    horizontal={true}
                    slideId={slideId}
                    isActive={isMenuOpen}
                    ariaLabel="Перетащить"
                    handleClick={() => useUIStateStore.getState().openContextMenu({ smartLayoutItemId: itemId })}
                    handleKeyDown={() => {}}
                    handleDragStart={handleItemDragStart}
                    dataAttributes={{
                        'data-smart-layout-item-drag-handle': itemId,
                    }}
                    title="Перетащите, чтобы переместить элемент"
                />
            )}
            {!isReadOnly && isMenuOpen && menuPosition && renderMenuComponent && renderMenuComponent(menuPosition)}

            {/* {!isReadOnly && isMenuOpen && menuPosition && (
                <ImageWithTextItemMenu
                    presentationId={presentationId}
                    position={menuPosition}
                    itemId={itemId}
                    slideId={slideId}
                    layoutId={layoutId}
                    elementId={elementId}
                />
            )} */}
            {children}
        </div>
    );
}

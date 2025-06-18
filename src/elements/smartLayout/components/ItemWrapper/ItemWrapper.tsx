/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useRef, useState } from 'react';
import DragHandler from '@/components/editor/DragHandler';
import { useMenuStore } from '@/store/menuStore';
import styles from './ItemWrapper.module.css';
import ImageWithTextItemMenu from '../ImagesWithText/ImageWithTextItemMenu/ImageWithTextItemMenu';
import { useDnd } from '@/contexts/DragDropContext';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

export default function ItemWrapper({
    children,
    presentationId,
    itemId,
    slideId,
    className,
    layoutId,
    elementId,
}: {
    children: React.ReactNode;
    presentationId: string;
    itemId: string;
    slideId: string;
    className?: string;
    layoutId: string;
    elementId: string;
}) {
    const isReadOnly = useReadOnly();

    const [hovered, setHovered] = useState(false);
    const isSelected = useMenuStore(state => state.smartLayoutItemId === itemId);
    const isMenuOpen = useMenuStore(state => state.isOpen && state.smartLayoutItemId === itemId);
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

        // Set drag image for smoother UX (optional enhancement)
        if (itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect();
            const dragImage = document.createElement('div');
            dragImage.className = styles.dragImage;
            dragImage.style.width = `${rect.width}px`;
            dragImage.style.height = `${rect.height}px`;
            dragImage.innerText = 'Item';
            document.body.appendChild(dragImage);

            e.dataTransfer.setDragImage(dragImage, 0, 0);

            // Clean up
            setTimeout(() => {
                document.body.removeChild(dragImage);
            }, 0);
        }
    };

    return (
        <div
            className={`${styles.container} ${className} ${isSelected ? styles.selected : ''}`}
            ref={itemRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => {
                if (!isReadOnly) {
                    useMenuStore.getState().setSelectedSmartLayoutItemId(layoutId, elementId, itemId);
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
                    ariaLabel="Drag handle"
                    handleClick={() => useMenuStore.getState().openMenu({ smartLayoutItemId: itemId })}
                    handleKeyDown={() => {}}
                    handleDragStart={handleItemDragStart}
                    dataAttributes={{
                        'data-smart-layout-item-drag-handle': itemId,
                    }}
                    title="Drag to reorder item (items can only be moved within the same smartLayout)"
                />
            )}

            {!isReadOnly && isMenuOpen && menuPosition && (
                <ImageWithTextItemMenu
                    presentationId={presentationId}
                    position={menuPosition}
                    itemId={itemId}
                    slideId={slideId}
                    layoutId={layoutId}
                    elementId={elementId}
                />
            )}
            {children}
        </div>
    );
}

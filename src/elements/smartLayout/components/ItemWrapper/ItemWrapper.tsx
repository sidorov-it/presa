/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useRef, useState } from 'react';
import DragHandler from '@/components/editor/DragHandler';
import { useMenuStore } from '@/store/menuStore';
import styles from './ItemWrapper.module.css';
import ImageWithTextItemMenu from '../ImagesWithText/ImageWithTextItemMenu/ImageWithTextItemMenu';

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
    const [hovered, setHovered] = useState(false);
    const isSelected = useMenuStore(state => state.smartLayoutItemId === itemId);
    const isMenuOpen = useMenuStore(state => state.isOpen && state.smartLayoutItemId === itemId);
    const itemRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (itemRef.current && isMenuOpen) {
            const clientRect = itemRef.current.getBoundingClientRect();
            setMenuPosition({ x: clientRect.width / 2, y: 0 });
        } else if (!isMenuOpen) {
            setMenuPosition(null);
        }
    }, [itemRef, isMenuOpen]);

    return (
        <div
            className={`${styles.container} ${className} ${isSelected ? styles.selected : ''}`}
            ref={itemRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => {
                useMenuStore.getState().setSelectedSmartLayoutItemId(layoutId, elementId, itemId);
            }}
        >
            {(hovered || isSelected) && (
                <DragHandler
                    className={styles.dragHandler}
                    horizontal={true}
                    slideId={slideId}
                    isActive={isMenuOpen}
                    ariaLabel="Drag handle"
                    handleClick={() => useMenuStore.getState().openMenu({ smartLayoutItemId: itemId })}
                    handleKeyDown={() => {}}
                    handleDragStart={() => {}}
                />
            )}

            {isMenuOpen && menuPosition && (
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

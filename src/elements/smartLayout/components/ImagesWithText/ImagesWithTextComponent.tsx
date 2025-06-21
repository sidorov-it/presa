/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { RefObject, useCallback, useState } from 'react';
import { SmartLayoutElement, SmartLayoutItem, TipTapRefs } from '@/types';
import styles from './ImagesWithText.module.css';
import Item from './Item/Item';
import { generateId } from '@/utils/id';
import { useDndStore } from '@/store/dndStore';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface ImagesWithTextComponentProps {
    element: SmartLayoutElement;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
    onUpdateElement?: (data: Partial<SmartLayoutElement>) => void;
}

export default function ImagesWithTextComponent({
    element,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
    onUpdateElement,
}: ImagesWithTextComponentProps) {
    const isReadOnly = useReadOnly();

    // const source = useDndStore(({ state }) => state.source);
    const smartLayoutItemId = useDndStore(state => state.state.source.smartLayoutItemId);
    // const source = useDndStore(state => state.state.source);
    const isDraggingFromSameLayout = useDndStore(
        state =>
            state.state.dragState &&
            state.state.source.elementId === element.id &&
            state.state.source.layoutId === layoutId &&
            !!state.state.source.smartLayoutItemId
    );

    const [dropIndicator, setDropIndicator] = useState<{ itemId: string; position: 'left' | 'right' } | null>(null);

    let columnSize = element.columnSize;
    const items = element.items || [];
    if (items.length === 1) {
        columnSize = 1;
    } else if (items.length === 2 && columnSize > 12) {
        columnSize = 2;
    } else if (items.length === 3 && columnSize > 18) {
        columnSize = 3;
    }

    const { align, imageShape, imageSize } = element;
    const itemsIds = items.map(item => item.id);

    const handleImageChange = useCallback(
        (itemId: string, imageUrl: string, uploaded: boolean) => {
            const updatedItems = items.map(item =>
                item.id === itemId ? { ...item, imageUrl, uploaded } : item
            );
            onUpdateElement?.({ items: updatedItems });
        },
        [items, onUpdateElement]
    );

    const handleContentChange = useCallback(
        (itemId: string, key: string) => (content: string) => {
            const updatedItems = items.map(item =>
                item.id === itemId ? { ...item, [key]: content } : item
            );
            onUpdateElement?.({ items: updatedItems });
        },
        [items, onUpdateElement]
    );

    const addItem = useCallback(() => {
        const newItemId = generateId();
        const newItem: SmartLayoutItem = {
            id: newItemId,
            title: '<p><span class="heading-text heading-3">Heading</span></p>',
            text: '<p><span>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</span></p>',
            imageUrl: '',
        };
        onUpdateElement?.({ items: [...items, newItem] });
    }, [items, onUpdateElement]);

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
            // Only allow if dragged from same smartLayout
            if (!isDraggingFromSameLayout) return;

            e.preventDefault();

            // Get the item DOM element
            const itemElement = document.querySelector(`[data-smart-layout-item-id="${targetItemId}"]`);
            if (!itemElement) return;

            const rect = itemElement.getBoundingClientRect();
            const isLeft = e.clientX < rect.left + rect.width / 2;

            // Only allow left/right positioning for image-with-text layout
            setDropIndicator({
                itemId: targetItemId,
                position: isLeft ? 'left' : 'right',
            });
        },
        [isDraggingFromSameLayout]
    );

    const handleDragLeave = useCallback(() => {
        setDropIndicator(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
            if (!isDraggingFromSameLayout || !dropIndicator) return;

            e.preventDefault();
            setDropIndicator(null);

            const draggedItemId = smartLayoutItemId;
            if (!draggedItemId || draggedItemId === targetItemId) return;

            const sourceIndex = items.findIndex(item => item.id === draggedItemId);
            const targetIndex = items.findIndex(item => item.id === targetItemId);

            if (sourceIndex === -1 || targetIndex === -1) return;

            const newItems = [...items];
            const [draggedItem] = newItems.splice(sourceIndex, 1);

            let insertPosition = targetIndex;
            if (dropIndicator.position === 'right') {
                insertPosition = targetIndex + (sourceIndex < targetIndex ? 0 : 1);
            } else {
                insertPosition = targetIndex - (sourceIndex > targetIndex ? 0 : 1);
            }

            insertPosition = Math.max(0, Math.min(newItems.length, insertPosition));

            newItems.splice(insertPosition, 0, draggedItem);

            onUpdateElement?.({ items: newItems });
        },
        [isDraggingFromSameLayout, dropIndicator, smartLayoutItemId, items, onUpdateElement]
    );

    return (
        <div
            className={`${styles.container} ${isFocused ? styles.focused : ''}`}
            style={{ gridTemplateColumns: `repeat(${columnSize * 6}, minmax(0px, 1fr))` }}
        >
            {itemsIds?.map((itemId, index) => (
                <div
                    key={itemId}
                    className={styles.itemContainer}
                    onDragOver={e => handleDragOver(e, itemId)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, itemId)}
                >
                    {!isReadOnly && dropIndicator && dropIndicator.itemId === itemId && (
                        <div
                            className={`${styles.dropIndicator} ${
                                dropIndicator.position === 'left' ? styles.left : styles.right
                            }`}
                        />
                    )}
                    <Item
                        isElementFocused={isFocused}
                        itemId={itemId}
                        elementId={element.id}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        align={align}
                        imageShape={imageShape}
                        imageSize={imageSize}
                        handleImageChange={handleImageChange}
                        handleTitleChange={handleContentChange(itemId, 'title')}
                        handleTextChange={handleContentChange(itemId, 'text')}
                        isLastItem={index === itemsIds.length - 1}
                        addItem={addItem}
                    />
                </div>
            ))}
        </div>
    );
}

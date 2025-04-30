/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { SmartLayoutElement, SmartLayoutItem } from '@/types';

import styles from './ImagesWithText.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import { RefObject, useCallback, useState } from 'react';
import { TipTapRefs } from '@/types';
import Item from './Item/Item';
import { useShallow } from 'zustand/react/shallow';
import { useDnd } from '@/contexts/DragDropContext';
import { generateId } from '@/utils/id';

export default function ImagesWithText({
    elementId,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
}: {
    elementId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
}) {
    const { state: dndState } = useDnd();
    const [dropIndicator, setDropIndicator] = useState<{ itemId: string; position: 'left' | 'right' } | null>(null);

    const columnSize = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;

            let columnSize = element.columnSize;
            const items = element.items || [];

            if (items.length === 1) {
                columnSize = 1;
            } else if (items.length === 2 && columnSize > 12) {
                columnSize = 2;
            } else if (items.length === 3 && columnSize > 18) {
                columnSize = 3;
            }
            return columnSize;
        })
    );

    const { align, imageShape, imageSize } = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
            return {
                align: element.align,
                imageShape: element.imageShape,
                imageSize: element.imageSize,
            };
        })
    );

    const itemsIds = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
            return element.items?.map(item => item.id) || [];
        })
    );

    const handleImageChange = useCallback(
        (itemId: string, imageUrl: string) => {
            const currentElement = usePresentationStore
                .getState()
                .getElement(presentationId, slideId, layoutId, elementId);

            if (!currentElement) return;

            const updatedItems = (currentElement as SmartLayoutElement).items?.map(item =>
                item.id === itemId ? { ...item, imageUrl } : item
            );
            usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, elementId, {
                items: updatedItems,
            } as Partial<SmartLayoutElement>);
        },
        [elementId, presentationId, slideId, layoutId]
    );

    const handleContentChange = useCallback(
        (itemId: string, key: string) => (content: string) => {
            const currentElement = usePresentationStore
                .getState()
                .getElement(presentationId, slideId, layoutId, elementId);

            if (!currentElement) return;
            const updatedItems = (currentElement as SmartLayoutElement).items?.map(item =>
                item.id === itemId ? { ...item, [key]: content } : item
            );

            usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, elementId, {
                items: updatedItems,
            } as Partial<SmartLayoutElement>);
        },
        [elementId, presentationId, slideId, layoutId]
    );

    const addItem = useCallback(() => {
        const newItemId = generateId();
        const newItem: SmartLayoutItem = {
            id: newItemId,
            title: '<p><span class="heading-text heading-3">Heading</span></p>',
            text: '<p><span>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</span></p>',
            imageUrl: '',
        };
        const element = usePresentationStore
            .getState()
            .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
        usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, elementId, {
            items: [...element.items, newItem],
        } as Partial<SmartLayoutElement>);
    }, [elementId, presentationId, slideId, layoutId]);

    // Check if dragged item is from same smartLayout
    const isDraggingFromSameLayout = useCallback(() => {
        const { source } = dndState;
        return (
            dndState.dragState === 'dragging' &&
            source.elementId === elementId &&
            source.layoutId === layoutId &&
            !!source.smartLayoutItemId
        );
    }, [dndState, elementId, layoutId]);

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
            // Only allow if dragged from same smartLayout
            if (!isDraggingFromSameLayout()) return;

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
            if (!isDraggingFromSameLayout() || !dropIndicator) return;

            e.preventDefault();
            setDropIndicator(null);

            const draggedItemId = dndState.source.smartLayoutItemId;
            if (!draggedItemId || draggedItemId === targetItemId) return;

            const element = usePresentationStore
                .getState()
                .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;

            if (!element || !element.items) return;

            const sourceIndex = element.items.findIndex(item => item.id === draggedItemId);
            const targetIndex = element.items.findIndex(item => item.id === targetItemId);

            if (sourceIndex === -1 || targetIndex === -1) return;

            const newItems = [...element.items];
            const [draggedItem] = newItems.splice(sourceIndex, 1);

            let insertPosition = targetIndex;
            if (dropIndicator.position === 'right') {
                insertPosition = targetIndex + (sourceIndex < targetIndex ? 0 : 1);
            } else {
                insertPosition = targetIndex - (sourceIndex > targetIndex ? 0 : 1);
            }

            insertPosition = Math.max(0, Math.min(newItems.length, insertPosition));

            newItems.splice(insertPosition, 0, draggedItem);

            usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, elementId, {
                items: newItems,
            } as Partial<SmartLayoutElement>);
        },
        [
            dndState.source.smartLayoutItemId,
            dropIndicator,
            elementId,
            layoutId,
            presentationId,
            slideId,
            isDraggingFromSameLayout,
        ]
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
                    {dropIndicator && dropIndicator.itemId === itemId && (
                        <div
                            className={`${styles.dropIndicator} ${
                                dropIndicator.position === 'left' ? styles.left : styles.right
                            }`}
                        />
                    )}
                    <Item
                        isElementFocused={isFocused}
                        itemId={itemId}
                        elementId={elementId}
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
                        columnsCount={itemsIds.length}
                    />
                </div>
            ))}
        </div>
    );
}

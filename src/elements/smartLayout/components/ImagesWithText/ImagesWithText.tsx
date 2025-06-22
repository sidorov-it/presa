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
import { generateId } from '@/utils/id';
import { useDndStore } from '@/store/dndStore';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { useSelectedElement } from '@/store/menuStore';

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
    const isReadOnly = useReadOnly();
    const selected = useSelectedElement();
    const isSelected =
        selected?.elementId === elementId &&
        selected?.layoutId === layoutId &&
        selected?.slideId === slideId;

    // const source = useDndStore(({ state }) => state.source);
    const smartLayoutItemId = useDndStore(state => state.state.source.smartLayoutItemId);
    // const source = useDndStore(state => state.state.source);
    const isDraggingFromSameLayout = useDndStore(
        state =>
            state.state.dragState &&
            state.state.source.elementId === elementId &&
            state.state.source.layoutId === layoutId &&
            !!state.state.source.smartLayoutItemId
    );

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
        (itemId: string, imageUrl: string, uploaded: boolean) => {
            const currentElement = usePresentationStore
                .getState()
                .getElement(presentationId, slideId, layoutId, elementId);

            if (!currentElement) return;

            const updatedItems = (currentElement as SmartLayoutElement).items?.map(item =>
                item.id === itemId ? { ...item, imageUrl, uploaded } : item
            );
            usePresentationStore.getState().updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    items: updatedItems,
                },
            });
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

            usePresentationStore.getState().updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    items: updatedItems,
                },
                createHistoryEntry: true,
                isTextElement: true,
            });
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
        usePresentationStore.getState().updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: {
                items: [...element.items, newItem],
            },
        });
    }, [elementId, presentationId, slideId, layoutId]);

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

            usePresentationStore.getState().updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    items: newItems,
                },
            });
        },
        [isDraggingFromSameLayout, dropIndicator, smartLayoutItemId, presentationId, slideId, layoutId, elementId]
    );

    return (
        <div
            className={`${styles.container} ${
                isFocused || isSelected ? styles.focused : ''
            }`}
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
                        isElementFocused={isFocused || isSelected}
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
                    />
                </div>
            ))}
        </div>
    );
}

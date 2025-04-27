/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RefObject, useCallback, useState } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, SmartLayoutItem, TipTapRefs } from '@/types';
import { useShallow } from 'zustand/react/shallow';
import { useDnd } from '@/contexts/DragDropContext';
import { generateId } from '@/utils/id';
import { HiPlus } from 'react-icons/hi2';
import Tiptap from '@/components/tiptap/Tiptap';
import ItemWrapper from '../ItemWrapper/ItemWrapper';

import styles from './TextBoxes.module.css';

export default function TextBoxes({
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
                columnSize = 4;
            } else if (items.length === 2 && columnSize > 2) {
                columnSize = 3;
            } else if (items.length === 3 && columnSize > 3) {
                columnSize = 2;
            }
            return columnSize;
        })
    );

    const align = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
            return element.align || 'left';
        })
    );

    const itemsIds = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
            return element.items?.map(item => item.id) || [];
        })
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
            title: '<p><span class="heading-text heading-3"></span></p>',
            text: '<p><span></span></p>',
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

            // Get current element with items
            const element = usePresentationStore
                .getState()
                .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;

            if (!element || !element.items) return;

            // Get indices of source and target
            const sourceIndex = element.items.findIndex(item => item.id === draggedItemId);
            const targetIndex = element.items.findIndex(item => item.id === targetItemId);

            if (sourceIndex === -1 || targetIndex === -1) return;

            // Create new items array by reordering
            const newItems = [...element.items];
            const [draggedItem] = newItems.splice(sourceIndex, 1);

            // Calculate insert position based on drop indicator position
            let insertPosition = targetIndex;
            if (dropIndicator.position === 'right') {
                insertPosition = targetIndex + (sourceIndex < targetIndex ? 0 : 1);
            } else {
                insertPosition = targetIndex - (sourceIndex > targetIndex ? 0 : 1);
            }

            // Ensure valid bounds
            insertPosition = Math.max(0, Math.min(newItems.length, insertPosition));

            // Insert item at new position
            newItems.splice(insertPosition, 0, draggedItem);

            // Update the layout with new order
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

    let elementWidth: string;

    if (columnSize === 4) {
        elementWidth = `25%`;
    } else if (columnSize === 3) {
        elementWidth = '33.33%';
    } else if (columnSize === 2) {
        elementWidth = '50%';
    } else if (columnSize === 1) {
        elementWidth = '100%';
    }

    return (
        <div className={`${styles.container} ${isFocused ? styles.focused : ''}`}>
            {itemsIds?.map((itemId, index) => (
                <div
                    key={itemId}
                    className={styles.itemContainer}
                    onDragOver={e => handleDragOver(e, itemId)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, itemId)}
                    data-smart-layout-item-id={itemId}
                    style={{
                        width: `calc(${elementWidth} - 1em)`,
                    }}
                >
                    {dropIndicator && dropIndicator.itemId === itemId && (
                        <div
                            className={`${styles.dropIndicator} ${
                                dropIndicator.position === 'left' ? styles.left : styles.right
                            }`}
                        />
                    )}
                    <ItemWrapper
                        presentationId={presentationId}
                        itemId={itemId}
                        slideId={slideId}
                        layoutId={layoutId}
                        elementId={elementId}
                    >
                        <div className={`${styles.textBox} ${align ? styles[align] : ''}`}>
                            <div className={styles.title}>
                                <Tiptap
                                    elementId={elementId}
                                    tiptapRefs={tiptapRefs}
                                    id={elementId}
                                    placeholder="Заголовок"
                                    onContentChange={handleContentChange(itemId, 'title')}
                                    presentationId={presentationId}
                                    slideId={slideId}
                                    layoutId={layoutId}
                                    customRefKey={`title-${elementId}-${itemId}`}
                                />
                            </div>
                            <div className={styles.content}>
                                <Tiptap
                                    elementId={elementId}
                                    tiptapRefs={tiptapRefs}
                                    id={elementId}
                                    presentationId={presentationId}
                                    slideId={slideId}
                                    layoutId={layoutId}
                                    placeholder="Текст"
                                    onContentChange={handleContentChange(itemId, 'text')}
                                    customRefKey={`text-${elementId}-${itemId}`}
                                    onEnterPressed={() => {
                                        return true;
                                    }}
                                />
                            </div>
                        </div>
                        {index === itemsIds.length - 1 && (
                            <div className={styles.addButton} onClick={addItem}>
                                <HiPlus style={{ width: '1rem', height: '1rem' }} />
                            </div>
                        )}
                    </ItemWrapper>
                </div>
            ))}
        </div>
    );
}

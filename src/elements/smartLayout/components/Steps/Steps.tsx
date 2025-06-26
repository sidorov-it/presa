/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RefObject, useCallback, useState } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, SmartLayoutItem, TipTapRefs } from '@/types';
import { useShallow } from 'zustand/react/shallow';
import { generateId } from '@/utils/id';
import { HiPlus } from 'react-icons/hi2';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import ItemWrapper from '../ItemWrapper/ItemWrapper';
import styles from './Steps.module.css';
import { useDndStore } from '@/store/dndStore';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

export default function Steps({
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
    const smartLayoutItemId = useDndStore(state => state.state.source.smartLayoutItemId);
    const isDraggingFromSameLayout = useDndStore(
        state =>
            state.state.dragState &&
            state.state.source.elementId === elementId &&
            state.state.source.layoutId === layoutId &&
            !!state.state.source.smartLayoutItemId
    );

    const [dropIndicator, setDropIndicator] = useState<{ itemId: string; position: 'left' | 'right' } | null>(null);

    const { columnSize, direction } = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement & { direction?: 'horizontal' | 'vertical' };
            return { columnSize: element.columnSize, direction: element.direction || 'horizontal' };
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
            title: '<p><span class="heading-text heading-3"></span></p>',
            text: '<p><span></span></p>',
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
            if (!isDraggingFromSameLayout) return;

            e.preventDefault();

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

    let elementWidth: string;

    if (columnSize === 4) {
        elementWidth = `25%`;
    } else if (columnSize === 3) {
        elementWidth = '33.33%';
    } else if (columnSize === 2) {
        elementWidth = '50%';
    } else {
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
                        width: direction === 'horizontal' ? `calc(${elementWidth} - 1em)` : '100%',
                        marginLeft: direction === 'horizontal' ? `${index}rem` : undefined,
                        marginTop: direction === 'vertical' ? `${index}rem` : undefined,
                    }}
                >
                    {dropIndicator && dropIndicator.itemId === itemId && (
                        <div
                            className={`${styles.dropIndicator} ${dropIndicator.position === 'left' ? styles.left : styles.right}`}
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
                            <div className={styles.step}>{index + 1}</div>
                            <Tiptap
                                isReadOnly={isReadOnly}
                                elementId={elementId}
                                tiptapRefs={tiptapRefs}
                                id={elementId}
                                placeholder="Заголовок"
                                onContentChange={handleContentChange(itemId, 'title')}
                                presentationId={presentationId}
                                slideId={slideId}
                                layoutId={layoutId}
                                customRefKey={`title-${elementId}-${itemId}`}
                                isHideSlashMenu={true}
                            />
                            <Tiptap
                                isReadOnly={isReadOnly}
                                elementId={elementId}
                                tiptapRefs={tiptapRefs}
                                id={elementId}
                                presentationId={presentationId}
                                slideId={slideId}
                                layoutId={layoutId}
                                placeholder="Текст"
                                onContentChange={handleContentChange(itemId, 'text')}
                                customRefKey={`text-${elementId}-${itemId}`}
                                isHideSlashMenu={true}
                                onEnterPressed={() => {
                                    return true;
                                }}
                            />
                            {!isReadOnly && index === itemsIds.length - 1 && (
                                <div className={styles.addButton} onClick={addItem}>
                                    <HiPlus style={{ width: '1rem', height: '1rem' }} />
                                </div>
                            )}
                        </div>
                    </ItemWrapper>
                </div>
            ))}
        </div>
    );
}

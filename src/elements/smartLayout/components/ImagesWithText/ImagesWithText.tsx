/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { SmartLayoutElement, SmartLayoutItem } from '@/types';

import styles from './ImagesWithText.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import { RefObject, useCallback } from 'react';
import { TipTapRefs } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import Item from './Item/Item';
import { useShallow } from 'zustand/react/shallow';

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
    const columnSize = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;

            let columnSize = element.columnSize;
            const items = element.items || [];

            if (items.length === 1) {
                columnSize = 6;
            } else if (items.length === 2 && columnSize > 12) {
                columnSize = 12;
            } else if (items.length === 3 && columnSize > 18) {
                columnSize = 18;
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
        const newItemId = uuidv4();
        const newItem: SmartLayoutItem = {
            id: newItemId,
            title: '<p><span class="heading-text heading-3"></span></p>',
            text: '<p><span></span></p>',
            imageUrl: '',
        };
        const element = usePresentationStore
            .getState()
            .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
        usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, elementId, {
            items: [...element.items, newItem],
        } as Partial<SmartLayoutElement>);
    }, [elementId, presentationId, slideId, layoutId]);

    return (
        <div
            className={`${styles.container} ${isFocused ? styles.focused : ''}`}
            style={{ gridTemplateColumns: `repeat(${columnSize}, minmax(0px, 1fr))` }}
        >
            {itemsIds?.map((itemId, index) => (
                <Item
                    key={itemId}
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
                />
            ))}
        </div>
    );
}

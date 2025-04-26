/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { SmartLayoutElement, SmartLayoutItem } from '@/types';

import styles from './ImagesWithText.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import { RefObject, useCallback } from 'react';
import { TipTapRefs } from '@/types';
import PlusIcon from '@/components/icons/PlusIcon';
import { v4 as uuidv4 } from 'uuid';
import Item from './Item/Item';

export default function ImagesWithText({
    element,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
}: {
    element: SmartLayoutElement;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
}) {
    const handleImageChange = useCallback(
        (itemId: string, imageUrl: string) => {
            const updatedItems = element.items?.map(item => (item.id === itemId ? { ...item, imageUrl } : item));
            usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, element.id, {
                items: updatedItems,
            } as Partial<SmartLayoutElement>);
        },
        [element, presentationId, slideId, layoutId]
    );

    const handleContentChange = useCallback(
        (itemId: string, key: string) => (content: string) => {
            const updatedItems = element.items?.map(item => (item.id === itemId ? { ...item, [key]: content } : item));

            usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, element.id, {
                items: updatedItems,
            } as Partial<SmartLayoutElement>);
        },
        [element, presentationId, slideId, layoutId]
    );
    let columnSize = element.columnSize;

    const items = element.items || [];
    if (items.length === 1) {
        columnSize = 6;
    } else if (items.length === 2 && columnSize > 12) {
        columnSize = 12;
    } else if (items.length === 3 && columnSize > 18) {
        columnSize = 18;
    }

    const addItem = useCallback(() => {
        const newItemId = uuidv4();
        const newItem: SmartLayoutItem = {
            id: newItemId,
            title: '<p><span class="heading-text heading-3"></span></p>',
            text: '<p><span></span></p>',
            imageUrl: '',
        };
        usePresentationStore.getState().updateElement(presentationId, slideId, layoutId, element.id, {
            items: [...element.items, newItem],
        } as Partial<SmartLayoutElement>);
    }, [element, presentationId, slideId, layoutId]);

    return (
        <div
            className={`${styles.container} ${isFocused ? styles.focused : ''}`}
            style={{ gridTemplateColumns: `repeat(${columnSize}, minmax(0px, 1fr))` }}
        >
            {element.items?.map((item, index) => (
                <Item
                    key={item.id}
                    isElementFocused={isFocused}
                    item={item}
                    elementId={element.id}
                    tiptapRefs={tiptapRefs}
                    presentationId={presentationId}
                    slideId={slideId}
                    layoutId={layoutId}
                    align={element.align}
                    imageShape={element.imageShape}
                    imageSize={element.imageSize}
                    handleImageChange={handleImageChange}
                    handleTitleChange={handleContentChange(item.id, 'title')}
                    handleTextChange={handleContentChange(item.id, 'text')}
                    isLastItem={index === items.length - 1}
                    addItem={addItem}
                />
            ))}
        </div>
    );
}

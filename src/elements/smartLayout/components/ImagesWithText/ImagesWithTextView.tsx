/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { RefObject } from 'react';

import { SmartLayoutElement } from '@/types';
import Image from '@/components/ui/Image/Image';
import { TipTapRefs } from '@/types';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';

import itemStyles from './Item/Item.module.css';
import getImageWidth from './getImageWidth';
import styles from './ImagesWithText.module.css';

export default function ImagesWithTextView({
    element,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
}: {
    element: SmartLayoutElement;
    tiptapRefs: RefObject<TipTapRefs> | null;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
}) {
    const isReadOnly = true;

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

    const imageWidth = getImageWidth(imageSize);

    const itemsIds = element.items?.map(item => item.id) || [];

    return (
        <div
            className={`${styles.container} ${isFocused ? styles.focused : ''}`}
            style={{ gridTemplateColumns: `repeat(${columnSize * 6}, minmax(0px, 1fr))` }}
        >
            {itemsIds?.map(itemId => {
                const item = items.find(item => item.id === itemId);
                if (!item) return null;

                return (
                    <div key={itemId} className={styles.itemContainer}>
                        <div className={`${itemStyles.item} ${align ? itemStyles[align] : ''}`}>
                            <Image
                                className={`${itemStyles.image} ${imageShape ? itemStyles[imageShape] : ''} ${styles.imageViewer}`}
                                imageUrl={item.imageUrl || ''}
                                onClearImage={() => {}}
                                onUpdateLink={() => {}}
                                isWidthRightMenu={true}
                                style={{
                                    // backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
                                    width: imageWidth ? `calc(${imageWidth}% - 1em)` : undefined,
                                }}
                                elementId={element.id}
                                presentationId={presentationId}
                                slideId={slideId}
                                layoutId={layoutId}
                                itemId={item.id}
                                isReadOnly={isReadOnly}
                            />
                            <div className={styles.content}>
                                <div className={styles.text}>
                                    <Tiptap
                                        // key={element.id}
                                        isReadOnly={isReadOnly}
                                        defaultContent={item.title || ''}
                                        elementId={element.id}
                                        tiptapRefs={tiptapRefs}
                                        id={`${element.id}-${item.id}-title`}
                                        placeholder="Заголовок"
                                        onContentChange={() => {}}
                                        presentationId={presentationId}
                                        slideId={slideId}
                                        layoutId={layoutId}
                                        // customRefKey={`title-${element.id}-${item.id}`}
                                        isHideSlashMenu={false}
                                        isInnerTiptap={true}
                                    />
                                </div>
                                <div className={styles.text}>
                                    <Tiptap
                                        // key={element.id}
                                        isReadOnly={isReadOnly}
                                        defaultContent={item.text || ''}
                                        elementId={element.id}
                                        tiptapRefs={tiptapRefs}
                                        id={`${element.id}-${item.id}-text`}
                                        presentationId={presentationId}
                                        slideId={slideId}
                                        layoutId={layoutId}
                                        placeholder="Текст"
                                        onContentChange={() => {}}
                                        isHideSlashMenu={false}
                                        isInnerTiptap={true}
                                    />
                                </div>
                            </div>
                            {/* <Item
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
                    /> */}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

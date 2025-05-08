/* eslint-disable jsx-a11y/img-redundant-alt */
import Tiptap from '@/components/tiptap/Tiptap';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder/ImagePlaceholder';
import { ImageShape, SmartLayoutElement, SmartLayoutItem, TipTapRefs } from '@/types';
import { RefObject, useRef } from 'react';
import ItemWrapper from '../../ItemWrapper/ItemWrapper';

import styles from './Item.module.css';
import { HiPlus } from 'react-icons/hi2';
import { usePresentationStore } from '@/store/presentationStore';
import Image from '@/components/ui/Image/Image';

type ItemProps = {
    itemId: string;
    isElementFocused: boolean;
    elementId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    align?: 'left' | 'center' | 'right';
    imageShape?: ImageShape;
    imageSize?: number;
    handleImageChange: (itemId: string, imageUrl: string, uploaded: boolean) => void;
    handleTitleChange: (content: string) => void;
    handleTextChange: (content: string) => void;
    addItem: () => void;
    isLastItem: boolean;
};

export default function Item({
    itemId,
    isElementFocused,
    elementId,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    handleTitleChange,
    handleTextChange,
    align,
    imageSize = 1,
    imageShape,
    handleImageChange,
    addItem,
    isLastItem,
}: ItemProps) {
    const item = usePresentationStore(state => {
        const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
        return element.items.find(item => item.id === itemId);
    }) as SmartLayoutItem;

    const imageRef = useRef<HTMLDivElement>(null);

    const imageWidthCoof = 14;
    const imageWidth = 30 + imageWidthCoof * (imageSize - 1);

    return (
        <ItemWrapper
            presentationId={presentationId}
            itemId={item.id}
            slideId={slideId}
            className={`${styles.item} ${align ? styles[align] : ''} ${isElementFocused ? styles.hovered : ''}`}
            layoutId={layoutId}
            elementId={elementId}
        >
            <Image
                imageUrl={item.imageUrl || ''}
                onClearImage={() => handleImageChange(item.id, '', false)}
                onUpdateLink={(link, uploaded) => handleImageChange(item.id, link, uploaded)}
                isWidthRightMenu={true}
                className={`${styles.image} ${imageShape ? styles[imageShape] : ''}`}
                style={{
                    backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
                    width: imageWidth ? `calc(${imageWidth}% - 1em)` : undefined,
                }}
                ref={imageRef}
            />
            <div className={styles.content}>
                <div className={styles.text}>
                    <Tiptap
                        // key={element.id}
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        id={elementId}
                        placeholder="Заголовок"
                        onContentChange={handleTitleChange}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        customRefKey={`title-${elementId}-${item.id}`}
                    />
                </div>
                <div className={styles.text}>
                    <Tiptap
                        // key={element.id}
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        id={elementId}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        placeholder="Текст"
                        onContentChange={handleTextChange}
                        customRefKey={`text-${elementId}-${item.id}`}
                        onEnterPressed={() => {
                            return true;
                        }}
                    />
                </div>
            </div>

            {isLastItem && (
                <div className={styles.addIcon} onClick={addItem}>
                    <HiPlus style={{ width: '1rem', height: '1rem' }} />
                </div>
            )}
        </ItemWrapper>
    );
}

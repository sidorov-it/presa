/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/img-redundant-alt */
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import { ImageShape, SmartLayoutElement, SmartLayoutItem, TipTapRefs } from '@/types';
import { RefObject } from 'react';
import ItemWrapper from '../../ItemWrapper/ItemWrapper';

import styles from './Item.module.css';
import { HiPlus } from 'react-icons/hi2';
import { FiLoader } from 'react-icons/fi';
import { usePresentationStore } from '@/store/presentationStore';
import { useAIImageStore } from '@/store/aiImageStore';
import Image from '@/components/ui/Image/Image';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import getImageWidth from '../getImageWidth';
import ImageWithTextItemMenu from '../ImageWithTextItemMenu/ImageWithTextItemMenu';

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
    const isReadOnly = useReadOnly();

    const item = usePresentationStore(state => {
        const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
        return element.items.find(item => item.id === itemId);
    }) as SmartLayoutItem;

    // Check if item is generating (from AI store)
    const aiStoreId = `${presentationId}_${slideId}_${layoutId}_${elementId}_${itemId}`;
    const aiImageStore = useAIImageStore();
    const isGenerating = aiImageStore.isGenerating(aiStoreId);

    const imageWidth = getImageWidth(imageSize);

    return (
        <ItemWrapper
            presentationId={presentationId}
            itemId={item.id}
            slideId={slideId}
            className={`${styles.item} ${align ? styles[align] : ''} ${isElementFocused ? styles.hovered : ''}`}
            layoutId={layoutId}
            elementId={elementId}
            renderMenuComponent={menuPosition => {
                return (
                    <ImageWithTextItemMenu
                        presentationId={presentationId}
                        position={menuPosition || { x: 0, y: 0 }}
                        itemId={itemId}
                        slideId={slideId}
                        layoutId={layoutId}
                        elementId={elementId}
                    />
                );
            }}
        >
            {/* Show loading state for AI generation */}
            {isGenerating ? (
                <div
                    className={`${styles.image} ${styles.loadingContainer} ${imageShape ? styles[imageShape] : ''}`}
                    style={{ width: imageWidth ? `calc(${imageWidth}% - 1em)` : undefined }}
                >
                    <div className={styles.loadingSpinner}>
                        <FiLoader className={styles.spinningIcon} />
                    </div>
                    <p className={styles.loadingText}>Генерируем изображение...</p>
                </div>
            ) : (
                <Image
                    imageUrl={item.imageUrl || ''}
                    onClearImage={() => handleImageChange(item.id, '', false)}
                    onUpdateLink={(link, uploaded) => handleImageChange(item.id, link, uploaded)}
                    isWidthRightMenu={true}
                    className={`${styles.image} ${imageShape ? styles[imageShape] : ''}`}
                    style={{
                        // backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
                        width: imageWidth ? `calc(${imageWidth}% - 1em)` : undefined,
                    }}
                    elementId={elementId}
                    presentationId={presentationId}
                    slideId={slideId}
                    layoutId={layoutId}
                    itemId={item.id}
                    isReadOnly={isReadOnly}
                />
            )}
            <div className={styles.content}>
                <div className={styles.title}>
                    <Tiptap
                        // key={element.id}
                        isReadOnly={isReadOnly}
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        id={elementId}
                        placeholder="Заголовок"
                        onContentChange={handleTitleChange}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        customRefKey={`title-${elementId}-${item.id}`}
                        isHideSlashMenu={true}
                        isInnerTiptap={true}
                        standardEnterBehavior={true}
                    />
                </div>
                <div className={styles.text}>
                    <Tiptap
                        // key={element.id}
                        isReadOnly={isReadOnly}
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        id={elementId}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        placeholder="Текст"
                        onContentChange={handleTextChange}
                        customRefKey={`text-${elementId}-${item.id}`}
                        standardEnterBehavior={true}
                        isInnerTiptap={true}
                        isHideSlashMenu={true}
                    />
                </div>
            </div>

            {!isReadOnly && isLastItem && (
                <div className={styles.addIcon} onClick={addItem}>
                    <HiPlus style={{ width: '1rem', height: '1rem' }} />
                </div>
            )}
        </ItemWrapper>
    );
}

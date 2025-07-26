import { Tiptap } from '@/components/tiptap/Tiptap';
import { TipTapRefs, SmartLayoutElement } from '@/types';
import { RefObject } from 'react';
import { HiPlus } from 'react-icons/hi';
import ItemWrapper from '../ItemWrapper/ItemWrapper';
import TimelineMenu from './TimelineMenu';
import { usePresentationStore } from '@/store/presentationStore';
import { getContrastingTextColor } from '@/utils/themeUtils';

import styles from './Timeline.module.css';
import { TimelineElementPosition } from './TimelineVertical';
import { useUIStateStore } from '@/store/uiStateStore';

const TimelineVerticalContent = ({
    itemId,
    _itemIndex,
    _originalIndex,
    isOnLeft,
    dropIndicator,
    timelineColor,
    presentationId,
    slideId,
    layoutId,
    elementId,
    isReadOnly,
    tiptapRefs,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    addItem,
    handleContentChange,
    showLines,
    elementRef,
    isLastItem,
    position,
    sides,
}: {
    itemId: string;
    _itemIndex: number;
    _originalIndex: number;
    isOnLeft: boolean;
    dropIndicator: { itemId: string; position: 'left' | 'right' } | null;
    timelineColor: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    elementId: string;
    isReadOnly: boolean;
    tiptapRefs: RefObject<TipTapRefs>;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => void;
    handleDragLeave: () => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => void;
    addItem: () => void;
    handleContentChange: (itemId: string, key: string) => (content: string) => void;
    showLines: boolean;
    elementRef: RefObject<HTMLDivElement>;
    isLastItem: boolean;
    position?: TimelineElementPosition;
    sides: 'one' | 'two';
}) => {
    // Get current item data for styling
    const element = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement
    );
    const currentItem = element?.items?.find(item => item.id === itemId);

    const isSelected = useUIStateStore(state => state.selectedSmartLayoutItemId === itemId);
    // Determine connection line direction based on layout
    const getConnectionLineClass = () => {
        if (sides === 'one') {
            // For one side, all elements connect to the timeline on the left
            return styles.toRight;
        } else {
            // For two sides, left elements connect right, right elements connect left
            return isOnLeft ? styles.toRight : styles.toLeft;
        }
    };

    // Apply background color and text color styles
    const itemStyle: React.CSSProperties = {};
    if (currentItem?.backgroundColor) {
        itemStyle.backgroundColor = currentItem.backgroundColor;
        const contrastColor = getContrastingTextColor(currentItem.backgroundColor);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        itemStyle['--presentation-text-color'] = contrastColor;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        itemStyle['--presentation-heading-color'] = contrastColor;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        itemStyle['--presentation-block-background-subtle'] = currentItem.backgroundColor;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        itemStyle['--presentation-block-text-color-subtle'] = contrastColor;
    }

    return (
        <div
            className={`${styles.verticalTimelineItem} ${isOnLeft ? styles.leftSide : styles.rightSide} ${
                isSelected ? styles.selected : ''
            }`}
            onDragOver={e => handleDragOver(e, itemId)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, itemId)}
            data-smart-layout-item-id={itemId}
            ref={elementRef}
            style={{
                top: position ? `${position.top}px` : 0,
                height: position ? `${position.minHeight}px` : 'auto',
            }}
        >
            {dropIndicator && dropIndicator.itemId === itemId && (
                <div
                    className={`${styles.dropIndicator} ${dropIndicator.position === 'left' ? styles.left : styles.right}`}
                    style={{ backgroundColor: timelineColor }}
                />
            )}

            {showLines && (
                <div
                    className={`${styles.verticalConnectionLine} ${getConnectionLineClass()}`}
                    style={{ backgroundColor: timelineColor }}
                />
            )}

            <ItemWrapper
                presentationId={presentationId}
                itemId={itemId}
                slideId={slideId}
                layoutId={layoutId}
                elementId={elementId}
                renderMenuComponent={menuPosition => {
                    return menuPosition ? (
                        <TimelineMenu
                            presentationId={presentationId}
                            position={menuPosition}
                            itemId={itemId}
                            slideId={slideId}
                            layoutId={layoutId}
                            elementId={elementId}
                            direction="vertical"
                        />
                    ) : null;
                }}
            >
                <div className={`${styles.textBox}`} style={{ position: 'relative', ...itemStyle }}>
                    <div className={styles.title}>
                        <Tiptap
                            isReadOnly={isReadOnly}
                            elementId={elementId}
                            tiptapRefs={tiptapRefs}
                            id={`${elementId}-title`}
                            presentationId={presentationId}
                            slideId={slideId}
                            layoutId={layoutId}
                            placeholder="Заголовок"
                            onContentChange={handleContentChange(itemId, 'title')}
                            customRefKey={`title-${elementId}-${itemId}`}
                            smartLayoutItemId={`title-${elementId}-${itemId}`}
                            isInnerTiptap={true}
                            isHideSlashMenu={true}
                            standardEnterBehavior={true}
                        />
                    </div>
                    <Tiptap
                        isReadOnly={isReadOnly}
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        id={`${elementId}-text`}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        placeholder="Текст"
                        onContentChange={handleContentChange(itemId, 'text')}
                        customRefKey={`text-${elementId}-${itemId}`}
                        smartLayoutItemId={`text-${elementId}-${itemId}`}
                        isInnerTiptap={true}
                        isHideSlashMenu={true}
                        standardEnterBehavior={true}
                    />
                    {!isReadOnly && isLastItem && (
                        <div className={styles.addButton} onClick={addItem}>
                            <HiPlus style={{ width: '1rem', height: '1rem' }} />
                        </div>
                    )}
                </div>
            </ItemWrapper>
        </div>
    );
};

export default TimelineVerticalContent;

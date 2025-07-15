import { Tiptap } from '@/components/tiptap/Tiptap';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import { RefObject, useMemo } from 'react';
import { HiPlus } from 'react-icons/hi';
import ItemWrapper from '../ItemWrapper/ItemWrapper';
import TimelineMenu from './TimelineMenu';
import { usePresentationStore } from '@/store/presentationStore';
import { getContrastingTextColor } from '@/utils/themeUtils';

import styles from './Timeline.module.css';
import { useUIStateStore } from '@/store/uiStateStore';

const TimelineHorizontalContent = ({
    itemId,
    direction,
    itemsIds,
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
    align,
    index,
    maxItemsCount,
    sides,
    isSecondLine,
    className,
    elementRef,
    isLastItem,
}: {
    itemId: string | null;
    direction: 'horizontal' | 'vertical';
    itemsIds: string[];
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
    align: 'left' | 'center' | 'right';
    index: number;
    maxItemsCount: number;
    className?: string;
    sides: 'one' | 'two';
    isSecondLine?: boolean;
    elementRef?: RefObject<HTMLDivElement>;
    isLastItem: boolean;
}) => {
    // Get current item data for styling
    // const element = usePresentationStore(
    //     state => state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement
    // );
    const currentItem = usePresentationStore(state =>
        (state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement).items?.find(
            item => item.id === itemId
        )
    );

    const isSelected = useUIStateStore(state => state.selectedSmartLayoutItemId === itemId);
    // const currentItem = element?;

    // Calculate the position for the second line items in two sides mode
    // to align them with their corresponding timeline points
    const itemStyle: { width: string; marginLeft?: string; marginRight?: string | number } = useMemo(() => {
        // Base style depending on direction
        const baseStyle =
            direction === 'horizontal' ? { width: `calc(100% / ${maxItemsCount} - 2em)` } : { width: '100%' };

        if (direction === 'horizontal') {
            if (sides === 'two') {
                // Two-sides mode: elements are distributed across two lines
                const totalElements = itemsIds.length;
                const isEvenTotal = totalElements % 2 === 0;

                if (isEvenTotal) {
                    const elementWidth = `calc(100% / (${totalElements / 2} + 0.5) - 2em)`;

                    // Even number of elements
                    if (isSecondLine) {
                        // Second line (bottom): offset by 2/3 of element width
                        return {
                            width: elementWidth,
                            marginLeft: index === 0 ? `calc(100% / (${totalElements / 2} + 0.5) / 2)` : '0',
                            marginRight: '0',
                        };
                    } else {
                        // First line (top): right margin at the end
                        return {
                            display: 'flex',
                            alignItems: 'flex-end',
                            width: elementWidth,
                            marginLeft: '0',
                            marginRight: index === maxItemsCount - 1 ? `calc(100% / ${totalElements / 2} / 2)` : '0',
                        };
                    }
                } else {
                    // Odd number of elements
                    const elementWidth = `calc(100% / ${Math.ceil(totalElements / 2)} - 2em)`;
                    if (isSecondLine) {
                        // Second line (bottom): offset by half element width
                        return {
                            width: elementWidth,
                            // maxWidth: elementWidth,
                            marginLeft: index === 0 ? `calc(${elementWidth} / 2 + 2.5em)` : '1em',
                            marginRight: '0',
                        };
                    } else {
                        // First line (top): full width
                        return {
                            display: 'flex',
                            alignItems: 'flex-end',
                            width: elementWidth,
                            marginLeft: '0',
                            marginRight: '0',
                        };
                    }
                }
            } else {
                // One-side mode: all elements on one line or centered under timeline points
                if (isSecondLine) {
                    // Center elements under timeline points
                    const elementWidth = `(100% / ${maxItemsCount} - 2em)`;
                    const timelinePointPosition = `((100% / ${itemsIds.length}) * ${index} + (100% / ${itemsIds.length}) / 2)`;
                    const marginLeft = `calc(${timelinePointPosition} - ${elementWidth} / 2)`;

                    return {
                        ...baseStyle,
                        marginLeft:
                            // index === 0 ? marginLeft : `calc(${marginLeft} - (100% / ${maxItemsCount}) * ${index})`,
                            index === 0 ? marginLeft : ``,
                        marginRight: 0,
                    };
                }
            }
        } else {
            // Vertical direction: flex layout handles spacing
            return baseStyle;
        }

        return baseStyle;
    }, [direction, sides, maxItemsCount, itemsIds, index, isSecondLine]);

    if (itemId === null) {
        // Return an empty div with the same width as content items to maintain spacing
        return (
            <div
                className={`${styles.itemContainer} ${isSelected ? styles.selected : ''}`}
                style={{
                    width: direction === 'horizontal' ? `calc(100% / ${maxItemsCount} - 2em)` : '100%',
                    visibility: 'hidden',
                }}
            />
        );
    }

    return (
        <div
            key={itemId}
            className={styles.itemContainer}
            onDragOver={e => handleDragOver(e, itemId)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, itemId)}
            data-smart-layout-item-id={itemId}
            data-item-index={`${elementId}-${index}-${isSecondLine ? 'second' : 'first'}`}
            style={{
                ...itemStyle,
                marginLeft: index === 0 && !isSecondLine ? '1em' : itemStyle.marginLeft,
            }}
            ref={elementRef}
        >
            {dropIndicator && dropIndicator.itemId === itemId && (
                <div
                    className={`${styles.dropIndicator} ${dropIndicator.position === 'left' ? styles.left : styles.right}`}
                    style={{ backgroundColor: timelineColor }}
                />
            )}
            <ItemWrapper
                className={`${className} ${isSelected ? styles.selected : ''}`}
                dragHandlerClassName={styles.dragHandler}
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
                            direction="horizontal"
                        />
                    ) : null;
                }}
            >
                <div
                    className={`${styles.textBox} ${align ? styles[align] : ''}`}
                    style={{ position: 'relative' }}
                >
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
                    <Tiptap
                        isReadOnly={isReadOnly}
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        id={`${elementId}-{}-text`}
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

export default TimelineHorizontalContent;

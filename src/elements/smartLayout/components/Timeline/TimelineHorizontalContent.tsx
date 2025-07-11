import { Tiptap } from '@/components/tiptap/Tiptap';
import { TipTapRefs } from '@/types';
import { RefObject, useMemo } from 'react';
import { HiPlus } from 'react-icons/hi';
import ItemWrapper from '../ItemWrapper/ItemWrapper';

import styles from './Timeline.module.css';

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
    // Calculate the position for the second line items in two sides mode
    // to align them with their corresponding timeline points
    const itemStyle = useMemo(() => {
        // Base style depending on direction
        const baseStyle =
            direction === 'horizontal' ? { width: `calc(100% / ${maxItemsCount} - 1em)` } : { width: '100%' };

        if (direction === 'horizontal') {
            if (sides === 'two') {
                // Two-sides mode: elements are distributed across two lines
                const totalElements = itemsIds.length;
                const isEvenTotal = totalElements % 2 === 0;

                if (isEvenTotal) {
                    const elementWidth = `calc(100% / (${totalElements / 2} + 0.5))`;

                    // Even number of elements
                    if (isSecondLine) {
                        // Second line (bottom): offset by 2/3 of element width
                        return {
                            width: elementWidth,
                            marginLeft: index === 0 ? `calc(100% / ${totalElements / 2} / 2)` : '0',
                            marginRight: '0',
                        };
                    } else {
                        // First line (top): right margin at the end
                        return {
                            width: elementWidth,
                            marginLeft: '0',
                            marginRight: index === maxItemsCount - 1 ? `calc(100% / ${totalElements / 2} / 2)` : '0',
                        };
                    }
                } else {
                    // Odd number of elements
                    const elementWidth = `calc(100% / ${Math.ceil(totalElements / 2)})`;
                    if (isSecondLine) {
                        // Second line (bottom): offset by half element width
                        return {
                            width: elementWidth,
                            // maxWidth: elementWidth,
                            marginLeft: index === 0 ? `calc(${elementWidth} / 2)` : '0',
                            marginRight: '0',
                        };
                    } else {
                        // First line (top): full width
                        return {
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
                    const elementWidth = `(100% / ${maxItemsCount})`;
                    const timelinePointPosition = `((100% / ${itemsIds.length}) * ${index} + (100% / ${itemsIds.length}) / 2)`;
                    const leftMargin = `calc(${timelinePointPosition} - ${elementWidth} / 2)`;

                    return {
                        ...baseStyle,
                        marginLeft:
                            index === 0 ? leftMargin : `calc(${leftMargin} - (100% / ${maxItemsCount}) * ${index})`,
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
                className={styles.itemContainer}
                style={{
                    width: direction === 'horizontal' ? `calc(100% / ${maxItemsCount} - 1em)` : '100%',
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
            style={itemStyle}
            ref={elementRef}
        >
            {dropIndicator && dropIndicator.itemId === itemId && (
                <div
                    className={`${styles.dropIndicator} ${dropIndicator.position === 'left' ? styles.left : styles.right}`}
                    style={{ backgroundColor: timelineColor }}
                />
            )}
            <ItemWrapper
                className={className}
                presentationId={presentationId}
                itemId={itemId}
                slideId={slideId}
                layoutId={layoutId}
                elementId={elementId}
                renderMenuComponent={_menuPosition => {
                    return <div>Menu timeline</div>;
                }}
            >
                <div className={`${styles.textBox} ${align ? styles[align] : ''}`} style={{ position: 'relative' }}>
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
                        isInnerTiptap={true}
                        isHideSlashMenu={true}
                        standardEnterBehavior={true}
                    />
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

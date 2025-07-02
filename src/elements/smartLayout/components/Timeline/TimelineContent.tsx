import { Tiptap } from '@/components/tiptap/Tiptap';
import { TipTapRefs } from '@/types';
import { RefObject } from 'react';
import { HiPlus } from 'react-icons/hi';
import ItemWrapper from '../ItemWrapper/ItemWrapper';

import styles from './Timeline.module.css';

const TimelineContent = ({
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
}) => {
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

    // Calculate the position for the second line items in two sides mode
    // to align them with their corresponding timeline points
    const getItemStyle = () => {
        // For horizontal two-sides mode, we need special width and positioning logic
        if (direction === 'horizontal' && sides === 'two') {
            const totalElements = itemsIds.length;
            const isEvenTotal = totalElements % 2 === 0;

            if (isEvenTotal) {
                // Even number of elements: both lines have same width, second line is offset
                const elementWidth = `calc(100% / ${maxItemsCount + 0.5})`;

                if (isSecondLine) {
                    // Second line (bottom): elements are offset by half element width to the right
                    return {
                        width: elementWidth,
                        marginLeft: index === 0 ? `calc(${elementWidth} / 2)` : '0',
                        marginRight: '0',
                    };
                } else {
                    // First line (top): elements take full width with right margin at the end
                    return {
                        width: elementWidth,
                        marginLeft: '0',
                        marginRight: index === maxItemsCount - 1 ? `calc(${elementWidth} / 2)` : '0',
                    };
                }
            } else {
                // Odd number of elements: all elements have same width
                const elementWidth = `calc(100% / ${totalElements})`;
                return {
                    width: elementWidth,
                    marginLeft: '0',
                    marginRight: '0',
                };
            }
        }

        // Original logic for other cases
        const baseStyle =
            direction === 'horizontal' ? { width: `calc(100% / ${maxItemsCount} - 1em)` } : { width: '100%' };

        // Position elements to center them under timeline points using margins instead of absolute positioning
        if (direction === 'horizontal') {
            if (sides === 'one' && isSecondLine) {
                // For "one side" mode, calculate left margin to center under timeline points
                // Timeline points are at: calc((100% / itemsIds.length) * index + (100% / itemsIds.length) / 2)
                const elementWidth = `(100% / ${maxItemsCount})`;
                const timelinePointPosition = `((100% / ${itemsIds.length}) * ${index} + (100% / ${itemsIds.length}) / 2)`;
                const leftMargin = `calc(${timelinePointPosition} - ${elementWidth} / 2)`;

                return {
                    ...baseStyle,
                    marginLeft: index === 0 ? leftMargin : `calc(${leftMargin} - (100% / ${maxItemsCount}) * ${index})`,
                    marginRight: 0,
                };
            } else if (sides === 'two' && isSecondLine) {
                return {
                    ...baseStyle,
                };
            } else if (sides === 'two' && !isSecondLine) {
                return {
                    ...baseStyle,
                    marginRight: 0,
                };
            }
        } else if (direction === 'vertical') {
            // For vertical direction, flex layout with justify-content: space-around handles spacing
            return {
                ...baseStyle,
            };
        }

        return baseStyle;
    };

    return (
        <div
            key={itemId}
            className={styles.itemContainer}
            onDragOver={e => handleDragOver(e, itemId)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, itemId)}
            data-smart-layout-item-id={itemId}
            style={getItemStyle()}
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
                        id={elementId}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        placeholder="Текст"
                        onContentChange={handleContentChange(itemId, 'text')}
                        customRefKey={`text-${elementId}-${itemId}`}
                        isHideSlashMenu={true}
                        standardEnterBehavior={true}
                    />
                    {!isReadOnly && index === itemsIds.length - 1 && (
                        <div className={styles.addButton} onClick={addItem}>
                            <HiPlus style={{ width: '1rem', height: '1rem' }} />
                        </div>
                    )}
                </div>
            </ItemWrapper>
        </div>
    );
};

export default TimelineContent;

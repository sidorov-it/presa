/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RefObject } from 'react';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import styles from './Timeline.module.css';

export default function TimelineView({
    element,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused: _isFocused,
}: {
    element: SmartLayoutElement & { direction?: 'horizontal' | 'vertical' };
    tiptapRefs: RefObject<TipTapRefs> | null;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
}) {
    const isReadOnly = useReadOnly();
    let columnSize = element.columnSize;
    const items = element.items || [];

    if (items.length === 1) {
        columnSize = 4;
    } else if (items.length === 2 && columnSize > 2) {
        columnSize = 3;
    } else if (items.length === 3 && columnSize > 3) {
        columnSize = 2;
    }

    const direction = element.direction || 'horizontal';
    const align = element.align || 'left';
    const sides = element.sides || 'one';
    const showNumbers = element.showNumbers || false;
    const showLines = element.showLines !== false; // Default to true
    const timelineColor = element.timelineColor || 'var(--presentation-primary-accent, var(--color-primary, #1e88e5))';

    const itemsIds = element.items?.map(item => item.id) || [];

    // Determine container class based on direction and sides - fix nested ternary
    const getContainerClasses = () => {
        const baseClasses = [styles.container];

        // Don't add focused styles in view mode
        // if (isFocused) baseClasses.push(styles.focused);

        if (direction === 'horizontal') {
            baseClasses.push(sides === 'two' ? styles.horizontalTwoSides : styles.horizontalOneSide);
        } else {
            // For vertical timeline, use the vertical timeline container
            baseClasses.push(styles.verticalTimelineContainer);
            baseClasses.push(sides === 'two' ? styles.verticalTwoSides : styles.verticalOneSide);
        }

        return baseClasses.join(' ');
    };

    const containerClasses = getContainerClasses();

    // Vertical timeline rendering
    if (direction === 'vertical') {
        return (
            <div
                className={containerClasses}
                style={{ '--item-count': itemsIds.length } as React.CSSProperties}
                data-read-only={isReadOnly}
            >
                <div className={styles.verticalTimelineWrapper}>
                    {/* Timeline line and points */}
                    <div
                        className={styles.verticalTimelineLine}
                        style={
                            {
                                '--timeline-color': timelineColor,
                            } as React.CSSProperties
                        }
                    >
                        {/* Main timeline line */}
                        <div className={styles.verticalTimelineMainLine} style={{ backgroundColor: timelineColor }} />

                        {/* Timeline points */}
                        {itemsIds.map((_, index) => (
                            <div
                                key={index}
                                className={styles.verticalTimelinePoint}
                                style={{
                                    backgroundColor: timelineColor,
                                    top: `${(100 / (itemsIds.length + 1)) * (index + 1)}%`,
                                }}
                            >
                                {showNumbers && (
                                    <div
                                        className={styles.markerNumber}
                                        style={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}
                                    >
                                        {index + 1}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Content items */}
                    <div className={styles.verticalTimelineContent}>
                        {itemsIds.map((itemId, index) => {
                            const item = element.items?.find(i => i.id === itemId);
                            if (!item) return null;

                            const isOnLeft = sides === 'two' ? index % 2 === 0 : false;
                            const itemPosition = `${(100 / (itemsIds.length + 1)) * (index + 1)}%`;

                            return (
                                <div
                                    key={itemId}
                                    className={`${styles.verticalTimelineItem} ${
                                        sides === 'one' || isOnLeft ? styles.leftSide : styles.rightSide
                                    }`}
                                    style={{
                                        top: itemPosition,
                                        transform: 'translateY(-50%)',
                                    }}
                                    data-smart-layout-item-id={itemId}
                                >
                                    {/* Connection line */}
                                    {showLines && (
                                        <div
                                            className={`${styles.verticalConnectionLine} ${
                                                sides === 'one' || isOnLeft ? styles.toRight : styles.toLeft
                                            }`}
                                            style={{ backgroundColor: timelineColor }}
                                        />
                                    )}

                                    <div className={`${styles.textBox} ${align ? styles[align] : ''}`}>
                                        <Tiptap
                                            isReadOnly={isReadOnly}
                                            defaultContent={item.text}
                                            elementId={element.id}
                                            tiptapRefs={tiptapRefs}
                                            id={element.id}
                                            presentationId={presentationId}
                                            slideId={slideId}
                                            layoutId={layoutId}
                                            placeholder="Текст"
                                            onContentChange={() => {}}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Horizontal timeline rendering (existing logic)
    let firstLineItems: (string | null)[] = [];
    let secondLineItems: (string | null)[] = [];
    let maxItemsCount;

    if (sides === 'one') {
        secondLineItems = itemsIds;
        maxItemsCount = itemsIds.length;
    } else {
        // Extract odd and even indexed items for two sides layout
        const oddIndexedItems: string[] = [];
        const evenIndexedItems: string[] = [];

        itemsIds.forEach((itemId, index) => {
            if (index % 2 === 0) {
                oddIndexedItems.push(itemId);
            } else {
                evenIndexedItems.push(itemId);
            }
        });

        // Create arrays with nulls to ensure equal width distribution
        const totalSlots = Math.max(oddIndexedItems.length, evenIndexedItems.length);

        firstLineItems = Array(totalSlots)
            .fill(null)
            .map((_, i) => (i < oddIndexedItems.length ? oddIndexedItems[i] : null));

        secondLineItems = Array(totalSlots)
            .fill(null)
            .map((_, i) => (i < evenIndexedItems.length ? evenIndexedItems[i] : null));

        maxItemsCount = totalSlots;
    }

    const renderTimelineItem = (itemId: string | null, index: number, isSecondLine = false) => {
        if (itemId === null) {
            return (
                <div
                    key={`empty-${index}`}
                    className={styles.itemContainer}
                    style={{
                        width: `calc(100% / ${maxItemsCount} - 1em)`,
                        visibility: 'hidden',
                    }}
                />
            );
        }

        const item = element.items?.find(i => i.id === itemId);
        if (!item) return null;

        // Calculate the position for the second line items in two sides mode
        // to align them with their corresponding timeline points
        const getItemStyle = () => {
            const baseStyle = { width: `calc(100% / ${maxItemsCount} - 1em)` };

            // Position elements to center them under timeline points using margins instead of absolute positioning
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
                // For second line items in two sides mode
                const originalItemIndex = index * 2 + 1; // Convert secondLine index to original item index
                const elementWidth = `(100% / ${maxItemsCount})`;
                const timelinePointPosition = `((100% / ${itemsIds.length + 1}) * ${originalItemIndex + 1})`;
                const leftMargin = `calc(${timelinePointPosition} - ${elementWidth} / 2)`;

                return {
                    ...baseStyle,
                    marginLeft: index === 0 ? leftMargin : `calc(${leftMargin} - (100% / ${maxItemsCount}) * ${index})`,
                    marginRight: 0,
                };
            } else if (sides === 'two' && !isSecondLine) {
                // For first line items in two sides mode
                const originalItemIndex = index * 2; // Convert firstLine index to original item index
                const elementWidth = `(100% / ${maxItemsCount})`;
                const timelinePointPosition = `((100% / ${itemsIds.length + 1}) * ${originalItemIndex + 1})`;
                const leftMargin = `calc(${timelinePointPosition} - ${elementWidth} / 2)`;

                return {
                    ...baseStyle,
                    marginLeft: index === 0 ? leftMargin : `calc(${leftMargin} - (100% / ${maxItemsCount}) * ${index})`,
                    marginRight: 0,
                };
            }

            return baseStyle;
        };

        return (
            <div
                key={itemId}
                className={styles.itemContainer}
                data-smart-layout-item-id={itemId}
                style={getItemStyle()}
            >
                <div className={`${styles.textBox} ${align ? styles[align] : ''}`} style={{ position: 'relative' }}>
                    {/* Connection line between timeline and content */}
                    {showLines && (
                        <div
                            className={`${styles.connectionLine} ${styles.horizontalConnectionLine}`}
                            style={{ backgroundColor: timelineColor }}
                        />
                    )}

                    {/* Timeline marker */}
                    <div className={styles.marker} style={{ backgroundColor: timelineColor }}>
                        {showNumbers && <div className={styles.markerNumber}>{index + 1}</div>}
                    </div>
                    <Tiptap
                        isReadOnly={isReadOnly}
                        defaultContent={item.text}
                        elementId={element.id}
                        tiptapRefs={tiptapRefs}
                        id={element.id}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        placeholder="Текст"
                        onContentChange={() => {}}
                    />
                </div>
            </div>
        );
    };

    return (
        <div
            className={containerClasses}
            style={{ '--item-count': itemsIds.length } as React.CSSProperties}
            data-read-only={isReadOnly}
        >
            <div className={`${styles.flexContainer} ${styles.horizontal}`}>
                <div className={styles.firstLine}>
                    {firstLineItems.map((itemId, index) => renderTimelineItem(itemId, index))}
                </div>

                <div
                    className={styles.timelineLineItems}
                    style={{ '--timeline-color': timelineColor } as React.CSSProperties}
                >
                    <div className={styles.timelineLineItemInvisible}></div>
                    {Array(itemsIds.length)
                        .fill(null)
                        .map((_, index) => {
                            const classNames = [styles.timelineLineItem];

                            if (showLines) {
                                if (sides === 'one') {
                                    classNames.push(styles.horizontalConnectionLine);
                                } else if (sides === 'two') {
                                    classNames.push(styles.horizontalTwoSidesConnectionLine);
                                }
                            }

                            // Different positioning logic for "one side" vs "two sides"
                            const timelinePointPosition =
                                sides === 'one'
                                    ? `calc((100% / ${itemsIds.length}) * ${index} + (100% / ${itemsIds.length}) / 2)` // Center of each block
                                    : `calc((100% / ${itemsIds.length + 1}) * ${index + 1})`; // Equal distances from borders
                            const positionStyle = { left: timelinePointPosition };

                            return <div key={index} className={classNames.join(' ')} style={positionStyle} />;
                        })}
                    <div className={styles.timelineLineItemInvisible}></div>
                </div>

                <div className={styles.secondLine}>
                    {secondLineItems.map((itemId, index) => renderTimelineItem(itemId, index, true))}
                </div>
            </div>
        </div>
    );
}

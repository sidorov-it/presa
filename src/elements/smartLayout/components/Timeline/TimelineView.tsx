/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { RefObject, useEffect, useState, useRef } from 'react';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
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
    const isReadOnly = true;

    const direction = element.direction || 'horizontal';
    const sides = element.sides || 'one';
    const showNumbers = element.showNumbers || false;
    const showLines = element.showLines !== false; // Default to true
    const timelineColor = element.timelineColor || 'var(--presentation-primary-accent, var(--color-primary, #1e88e5))';

    const itemsIds = element.items?.map(item => item.id) || [];
    const [elementPositions, setElementPositions] = useState<
        Array<{ top: number; height: number; side: 'left' | 'right'; minHeight: number }>
    >([]);
    const elementRefs = useRef<{ [key: string]: RefObject<HTMLDivElement> }>({});

    // Create refs for each element
    useEffect(() => {
        const newRefs: { [key: string]: RefObject<HTMLDivElement> } = {};
        itemsIds.forEach(itemId => {
            newRefs[itemId] = React.createRef<HTMLDivElement>();
        });
        elementRefs.current = newRefs;
    }, [itemsIds]);

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

    // Calculate element positions for vertical timeline (like in TimelineVertical.tsx)
    useEffect(() => {
        if (direction !== 'vertical') return;

        const getSideForIndex = (index: number): 'left' | 'right' => {
            if (sides === 'two') {
                return index % 2 === 0 ? 'left' : 'right';
            }
            return 'right';
        };

        const updatePositions = () => {
            const positions: Array<{ top: number; height: number; side: 'left' | 'right'; minHeight: number }> = [];

            if (sides === 'one') {
                // For one side, use simple vertical stacking
                let cumulativeHeight = 0;
                itemsIds.forEach(itemId => {
                    const elementRef = elementRefs.current[itemId];
                    let height = 90; // Default height matching minimum height

                    if (elementRef?.current) {
                        // Temporarily reset height to auto to get natural content height
                        const originalHeight = elementRef.current.style.height;
                        elementRef.current.style.height = 'auto';

                        // Get the natural content height by looking at the textBox inside
                        const textBox = elementRef.current.querySelector(`.${styles.textBox}`) as HTMLElement;
                        if (textBox) {
                            // Force a reflow to ensure accurate height measurement
                            void elementRef.current.offsetHeight;
                            height = textBox.offsetHeight + 40; // Add padding/margin
                        } else {
                            height = elementRef.current.scrollHeight;
                        }

                        // Restore original height temporarily (will be overridden by position update)
                        elementRef.current.style.height = originalHeight;
                    }

                    positions.push({
                        top: cumulativeHeight + 10,
                        height,
                        side: 'right',
                        minHeight: height, // For one side, minHeight equals natural height
                    });

                    cumulativeHeight += height + 30; // 30px gap for consistency
                });
            } else {
                // For two sides, implement overlapping logic
                let leftBottom = 0; // Bottom position of the last left element
                let rightBottom = 0; // Bottom position of the last right element

                itemsIds.forEach((itemId, index) => {
                    const elementRef = elementRefs.current[itemId];
                    const side = getSideForIndex(index);
                    let height = 90; // Default height matching minimum height

                    if (elementRef?.current) {
                        // Temporarily reset height to auto to get natural content height
                        const originalHeight = elementRef.current.style.height;
                        elementRef.current.style.height = 'auto';

                        // Get the natural content height by looking at the textBox inside
                        const textBox = elementRef.current.querySelector(`.${styles.textBox}`) as HTMLElement;
                        if (textBox) {
                            // Force a reflow to ensure accurate height measurement
                            void elementRef.current.offsetHeight;
                            height = textBox.offsetHeight + 40; // Add padding/margin
                        } else {
                            height = elementRef.current.scrollHeight;
                        }

                        // Restore original height temporarily (will be overridden by position update)
                        elementRef.current.style.height = originalHeight;
                    }

                    let top = 0;
                    let minHeight = height; // Start with natural content height

                    if (index === 0) {
                        // First element starts at the top
                        top = 0;
                        minHeight = height; // Use natural height for first element
                    } else {
                        if (side === 'left') {
                            // Left element: position below the last left element with small indent
                            top = leftBottom + 10; // Small indent from previous element on same side

                            // Check if we need to extend for overlap with the opposite (right) element
                            const currentNaturalBottom = top + height;

                            // If there's a right element and current element's bottom would be less than 30px beyond the right element's bottom
                            if (rightBottom > 0 && currentNaturalBottom < rightBottom + 30) {
                                // Extend current element so its bottom is 30px beyond the right element's bottom
                                minHeight = rightBottom + 48 - top;
                            } else {
                                // Element is already tall enough or no opposite element, use natural height
                                minHeight = height;
                            }
                        } else {
                            // Right element: position below the last right element with small indent
                            top = rightBottom + (index === 1 ? 48 : 10); // Small indent from previous element on same side

                            // Check if we need to extend for overlap with the opposite (left) element
                            const currentNaturalBottom = top + height;

                            // If there's a left element and current element's bottom would be less than 30px beyond the left element's bottom
                            if (leftBottom > 0 && currentNaturalBottom < leftBottom + 30) {
                                // Extend current element so its bottom is 30px beyond the left element's bottom
                                minHeight = leftBottom + 48 - top;
                            } else {
                                // Element is already tall enough or no opposite element, use natural height
                                minHeight = height;
                            }
                        }
                    }

                    positions.push({
                        top,
                        height,
                        side,
                        minHeight,
                    });

                    // Update the bottom positions using the actual minHeight
                    if (side === 'left') {
                        leftBottom = top + minHeight;
                    } else {
                        rightBottom = top + minHeight;
                    }
                });
            }

            setElementPositions(positions);
        };

        // Use timeout to ensure DOM updates are complete
        const timeoutId = setTimeout(updatePositions, 300);

        const resizeObserver = new ResizeObserver(() => {
            setTimeout(updatePositions, 50);
        });

        // Observe each individual element
        itemsIds.forEach(itemId => {
            const elementRef = elementRefs.current[itemId];
            if (elementRef?.current) {
                resizeObserver.observe(elementRef.current);
            }
        });

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [itemsIds, sides, direction]);

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
                                height:
                                    elementPositions.length > 0
                                        ? `${Math.max(...elementPositions.map(p => p.top + p.minHeight)) + 40}px`
                                        : '100%',
                            } as React.CSSProperties
                        }
                    >
                        {/* Main timeline line */}
                        <div className={styles.verticalTimelineMainLine} style={{ backgroundColor: timelineColor }} />

                        {/* Timeline points */}
                        {elementPositions.map((position, index) => (
                            <div
                                key={index}
                                className={styles.verticalTimelinePoint}
                                style={{
                                    backgroundColor: timelineColor,
                                    top: `${position.top + 2}px`, // Match editor positioning with 2px offset
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
                    <div
                        className={styles.verticalTimelineContent}
                        style={{
                            height:
                                elementPositions.length > 0
                                    ? `${Math.max(...elementPositions.map(p => p.top + p.minHeight)) + 40}px`
                                    : '100%',
                        }}
                    >
                        {itemsIds.map((itemId, index) => {
                            const item = element.items?.find(i => i.id === itemId);
                            if (!item) return null;

                            const position = elementPositions[index];
                            if (!position) return null; // Skip if position not calculated yet
                            
                            const isOnLeft = position.side === 'left';

                            return (
                                <div
                                    key={itemId}
                                    className={`${styles.verticalTimelineItem} ${
                                        isOnLeft ? styles.leftSide : styles.rightSide
                                    }`}
                                    style={{
                                        top: `${position.top}px`,
                                        height: `${position.minHeight}px`,
                                    }}
                                    data-smart-layout-item-id={itemId}
                                    ref={elementRefs.current[itemId]}
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

                                    <div className={`${styles.textBox}`}>
                                        <Tiptap
                                            isReadOnly={isReadOnly}
                                            defaultContent={item.title || ''}
                                            elementId={element.id}
                                            tiptapRefs={tiptapRefs}
                                            id={`${element.id}-title`}
                                            presentationId={presentationId}
                                            slideId={slideId}
                                            layoutId={layoutId}
                                            placeholder="Заголовок"
                                            onContentChange={() => {}}
                                        />
                                        <Tiptap
                                            isReadOnly={isReadOnly}
                                            defaultContent={item.text || ''}
                                            elementId={element.id}
                                            tiptapRefs={tiptapRefs}
                                            id={`${element.id}-text`}
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
                <div className={`${styles.textBox}`} style={{ position: 'relative' }}>
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
                        defaultContent={item.title || ''}
                        elementId={element.id}
                        tiptapRefs={tiptapRefs}
                        id={`${element.id}-title-${index}`}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        placeholder="Заголовок"
                        onContentChange={() => {}}
                    />
                    <Tiptap
                        isReadOnly={isReadOnly}
                        defaultContent={item.text || ''}
                        elementId={element.id}
                        tiptapRefs={tiptapRefs}
                        id={`${element.id}-text-${index}`}
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

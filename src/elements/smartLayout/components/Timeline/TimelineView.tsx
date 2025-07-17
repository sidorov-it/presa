/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { RefObject, useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
    const timelineLineItemsRef = useRef<HTMLDivElement>(null);

    const direction = element.direction || 'horizontal';
    const sides = element.sides || 'one';
    const showNumbers = element.showNumbers || false;
    const showLines = element.showLines !== false; // Default to true
    const timelineColor = element.timelineColor || 'var(--presentation-primary-accent, var(--color-primary, #1e88e5))';
    const numbersColor = element.numbersColor || 'var(--presentation-primary-accent-contrast-text-color, #000)';

    const itemsIds = useMemo(() => element.items?.map(item => item.id) || [], [element.items]);
    const [elementPositions, setElementPositions] = useState<
        Array<{ top: number; height: number; side: 'left' | 'right'; minHeight: number }>
    >([]);
    const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
    const elementRefs = useRef<{ [key: string]: RefObject<HTMLDivElement> }>({});
    const containerRef = useRef<HTMLDivElement>(null);

    // Create refs for each element
    useEffect(() => {
        const newRefs: { [key: string]: RefObject<HTMLDivElement> } = {};
        itemsIds.forEach(itemId => {
            // Preserve existing refs if they exist
            if (elementRefs.current[itemId]) {
                newRefs[itemId] = elementRefs.current[itemId];
            } else {
                newRefs[itemId] = React.createRef<HTMLDivElement>();
            }
        });
        elementRefs.current = newRefs;
    }, [itemsIds]);

    // Force update positions function
    const forceUpdatePositions = useCallback(() => {
        setForceUpdateCounter(prev => prev + 1);
    }, []);

    // Force recalculation when sides changes (template switch)
    useEffect(() => {
        // Add a small delay to ensure the DOM has updated after the sides change
        const timeoutId = setTimeout(() => {
            forceUpdatePositions();
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [sides, forceUpdatePositions]);

    // Determine container class based on direction and sides
    const getContainerClasses = () => {
        const baseClasses = [styles.container];

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
            if (!containerRef.current) return;

            // Check if all refs are properly attached to DOM elements
            const allRefsAttached = itemsIds.every(itemId => {
                const ref = elementRefs.current[itemId];
                return ref && ref.current;
            });

            if (!allRefsAttached) {
                // If refs are not ready, try again after a short delay
                console.log('TimelineView: Refs not ready, retrying...', {
                    itemsIds,
                    refs: Object.keys(elementRefs.current),
                    attachedRefs: itemsIds.map(id => ({ id, attached: !!elementRefs.current[id]?.current })),
                });
                setTimeout(updatePositions, 50);
                return;
            }

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

        // Use longer timeout when sides changes to ensure DOM updates are complete
        const timeoutId = setTimeout(updatePositions, 300);

        const resizeObserver = new ResizeObserver(() => {
            setTimeout(updatePositions, 50);
        });

        // Don't observe the container since children are absolutely positioned
        // Instead, observe each individual element
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
    }, [itemsIds, sides, direction, forceUpdateCounter]);

    // Force update positions when items content changes
    useEffect(() => {
        if (direction === 'vertical' && element.items) {
            const timeoutId = setTimeout(() => {
                forceUpdatePositions();
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [direction, element.items, forceUpdatePositions]);

    // Additional effect to force update when refs are created
    useEffect(() => {
        if (direction === 'vertical' && itemsIds.length > 0) {
            // Wait a bit for refs to be attached to DOM
            const timeoutId = setTimeout(() => {
                forceUpdatePositions();
            }, 200);

            return () => clearTimeout(timeoutId);
        }
    }, [direction, itemsIds, forceUpdatePositions]);

    // Vertical timeline rendering
    if (direction === 'vertical') {
        return (
            <div
                className={containerClasses}
                style={{ '--item-count': itemsIds.length } as React.CSSProperties}
                data-read-only={isReadOnly}
                ref={containerRef}
            >
                <div className={styles.verticalTimelineWrapper}>
                    {/* Timeline line and points */}
                    <div
                        className={styles.verticalTimelineLine}
                        style={
                            {
                                '--timeline-color': timelineColor,
                                '--numbers-color': numbersColor,
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
                                    top: `${position?.top + 2}px`, // Match editor positioning with 2px offset
                                }}
                            >
                                {showNumbers && (
                                    <div
                                        className={styles.markerNumber}
                                        style={{ color: numbersColor, fontSize: '0.7rem', fontWeight: 'bold' }}
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
                            // if (!position) return null; // Skip if position not calculated yet

                            const isOnLeft = position?.side === 'left';

                            return (
                                <div
                                    key={itemId}
                                    className={`${styles.verticalTimelineItem} ${isOnLeft ? styles.leftSide : styles.rightSide
                                        }`}
                                    style={{
                                        top: position ? `${position.top}px` : 0,
                                        height: position ? `${position.minHeight}px` : 'auto',
                                    }}
                                    data-smart-layout-item-id={itemId}
                                    ref={elementRefs.current[itemId]}
                                >
                                    {/* Connection line */}
                                    {showLines && (
                                        <div
                                            className={`${styles.verticalConnectionLine} ${sides === 'one' || isOnLeft ? styles.toRight : styles.toLeft
                                                }`}
                                            style={{ backgroundColor: timelineColor }}
                                        />
                                    )}

                                    <div className={`${styles.textBox}`}>
                                        <div className={styles.title}>
                                            <Tiptap
                                                isReadOnly={isReadOnly}
                                                defaultContent={item.title || ''}
                                                elementId={element.id}
                                                tiptapRefs={tiptapRefs}
                                                id={`${element.id}-title-${itemId}`}
                                                presentationId={presentationId}
                                                slideId={slideId}
                                                layoutId={layoutId}
                                                isInnerTiptap={true}
                                                placeholder="Заголовок"
                                            // onContentChange={null}
                                            />
                                        </div>
                                        <Tiptap
                                            isReadOnly={isReadOnly}
                                            defaultContent={item.text || ''}
                                            elementId={element.id}
                                            tiptapRefs={tiptapRefs}
                                            id={`${element.id}-text-${itemId}`}
                                            presentationId={presentationId}
                                            slideId={slideId}
                                            layoutId={layoutId}
                                            isInnerTiptap={true}
                                            placeholder="Текст"
                                        // onContentChange={() => {}}
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

    // Horizontal timeline rendering - Fixed implementation based on editor components
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

    // Helper function to get item styling based on position and sides
    const getItemStyle = (index: number, isSecondLine: boolean) => {
        const baseStyle = { width: `calc(100% / ${maxItemsCount} - 2em)` };

        if (sides === 'two') {
            // Two-sides mode: elements are distributed across two lines
            const totalElements = itemsIds.length;
            const isEvenTotal = totalElements % 2 === 0;

            if (isEvenTotal) {
                const elementWidth = `calc(100% / (${totalElements / 2} + 0.5) - 2em)`;

                // Even number of elements
                if (isSecondLine) {
                    // Second line (bottom): offset by half element width
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
                    marginLeft: index === 0 ? marginLeft : ``,
                    marginRight: 0,
                };
            }
        }

        return baseStyle;
    };

    const renderTimelineItem = (itemId: string | null, index: number, isSecondLine = false) => {
        if (itemId === null) {
            return (
                <div
                    key={`empty-${index}`}
                    className={styles.itemContainer}
                    style={{
                        width: `calc(100% / ${maxItemsCount} - 2em)`,
                        visibility: 'hidden',
                    }}
                />
            );
        }

        const item = element.items?.find(i => i.id === itemId);
        if (!item) return null;

        const itemStyle = getItemStyle(index, isSecondLine);

        return (
            <div key={itemId} className={styles.itemContainer} data-smart-layout-item-id={itemId}

                data-item-index={`${element.id}-${index}-${isSecondLine ? 'second' : 'first'}`}
                style={{
                    ...itemStyle,
                    marginLeft: index === 0 && !isSecondLine ? '1em' : itemStyle.marginLeft,
                }}
            >
                <div className={`${styles.textBox}`} style={{ position: 'relative' }}>
                    {/* Connection line between timeline and content */}
                    {/* {showLines && (
                        <div
                            className={`${styles.connectionLine} ${styles.horizontalConnectionLine}`}
                            style={{ backgroundColor: timelineColor }}
                        />
                    )} */}

                    <div className={styles.title}>
                        <Tiptap
                            isReadOnly={isReadOnly}
                            defaultContent={item.title || ''}
                            elementId={element.id}
                            tiptapRefs={tiptapRefs}
                            id={`${element.id}-title-${index}`}
                            presentationId={presentationId}
                            slideId={slideId}
                            isInnerTiptap={true}
                            layoutId={layoutId}
                            placeholder="Заголовок"
                            onContentChange={() => { }}
                        />
                    </div>
                    <Tiptap
                        isReadOnly={isReadOnly}
                        defaultContent={item.text || ''}
                        elementId={element.id}
                        tiptapRefs={tiptapRefs}
                        id={`${element.id}-text-${index}`}
                        presentationId={presentationId}
                        slideId={slideId}
                        isInnerTiptap={true}
                        layoutId={layoutId}
                        placeholder="Текст"
                        onContentChange={() => { }}
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
            ref={containerRef}
        >
            <div className={`${styles.flexContainer} ${styles.horizontal}`}>
                <div className={styles.firstLine}>
                    {firstLineItems.map((itemId, index) => renderTimelineItem(itemId, index))}
                </div>

                <div
                    className={styles.timelineLineItems}
                    ref={timelineLineItemsRef}
                    style={
                        {
                            '--timeline-color': timelineColor,
                            '--numbers-color': numbersColor,
                        } as React.CSSProperties
                    }
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

                            if (showNumbers) {
                                classNames.push(styles.timelineLineItemNumber);
                            }

                            // Different positioning logic for "one side" vs "two sides"
                            const timelinePointPosition =
                                sides === 'one'
                                    ? `calc((100% / ${itemsIds.length}) * ${index} + (100% / ${itemsIds.length}) / 2 - 0.5em)` // Center of each block
                                    : `calc((100% / ${itemsIds.length + 1}) * ${index + 1} - 0.5em)`; // Equal distances from borders
                            const positionStyle = { left: timelinePointPosition };

                            const attributes = showNumbers ? { 'data-number': index + 1 } : {};

                            return (
                                <div
                                    key={index}
                                    className={classNames.join(' ')}
                                    style={
                                        {
                                            ...positionStyle,
                                            '--numbers-color': numbersColor,
                                        } as React.CSSProperties
                                    }
                                    {...attributes}
                                />
                            );
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

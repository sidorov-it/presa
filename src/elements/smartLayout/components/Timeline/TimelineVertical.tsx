/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { RefObject, useCallback, useRef, useState, useEffect } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, SmartLayoutItem, TipTapRefs } from '@/types';
import { useShallow } from 'zustand/react/shallow';
import { generateId } from '@/utils/id';
import styles from './Timeline.module.css';
import { useDndStore } from '@/store/dndStore';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import TimelineVerticalContent from './TimelineVerticalContent';

export interface TimelineElementPosition {
    top: number;
    height: number;
    side: 'left' | 'right';
    minHeight?: number;
}

export default function TimelineVertical({
    elementId,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
}: {
    elementId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
}) {
    const isReadOnly = useReadOnly();
    const smartLayoutItemId = useDndStore(state => state.state.source.smartLayoutItemId);
    const isDraggingFromSameLayout = useDndStore(
        state =>
            state.state.dragState &&
            state.state.source.elementId === elementId &&
            state.state.source.layoutId === layoutId &&
            !!state.state.source.smartLayoutItemId
    );

    const [dropIndicator, setDropIndicator] = useState<{ itemId: string; position: 'left' | 'right' } | null>(null);
    const [elementPositions, setElementPositions] = useState<TimelineElementPosition[]>([]);
    const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const elementRefs = useRef<{ [key: string]: RefObject<HTMLDivElement> }>({});

    const { sides, showLines, timelineColor, numbersColor, showNumbers } = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement & {
                sides?: 'one' | 'two';
                showLines?: boolean;
                timelineColor?: string;
                numbersColor?: string;
                showNumbers?: boolean;
            };
            return {
                sides: element.sides || 'one',
                showLines: element.showLines !== false,
                numbersColor: element.numbersColor || 'var(--color-text, #000)',
                timelineColor:
                    element.timelineColor || 'var(--presentation-primary-accent, var(--color-primary, #1e88e5))',
                showNumbers: element.showNumbers || false,
            };
        })
    );

    const itemsIds = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
            return element.items?.map(item => item.id) || [];
        })
    );

    // Create refs for each element
    useEffect(() => {
        const newRefs: { [key: string]: RefObject<HTMLDivElement> } = {};
        itemsIds.forEach(itemId => {
            newRefs[itemId] = React.createRef<HTMLDivElement>();
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

    // Calculate element positions for vertical timeline
    useEffect(() => {
        const getSideForIndex = (index: number): 'left' | 'right' => {
            if (sides === 'two') {
                return index % 2 === 0 ? 'left' : 'right';
            }
            return 'right';
        };

        const updatePositions = () => {
            if (!containerRef.current) return;

            const positions: TimelineElementPosition[] = [];

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

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                let lastLeftStart = 0; // Start position of the last left element
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                let lastRightStart = 0; // Start position of the last right element

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

                            // Update tracking for left side
                            lastLeftStart = top;
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

                            // Update tracking for right side
                            lastRightStart = top;
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
    }, [itemsIds, sides, forceUpdateCounter]);

    const handleContentChange = useCallback(
        (itemId: string, key: string) => (content: string) => {
            const currentElement = usePresentationStore
                .getState()
                .getElement(presentationId, slideId, layoutId, elementId);

            if (!currentElement) return;
            const updatedItems = (currentElement as SmartLayoutElement).items?.map(item =>
                item.id === itemId ? { ...item, [key]: content } : item
            );

            usePresentationStore.getState().updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    items: updatedItems,
                },
                createHistoryEntry: true,
                isTextElement: true,
            });

            // Force update positions after DOM has updated
            setTimeout(() => {
                forceUpdatePositions();
            }, 100);
        },
        [elementId, presentationId, slideId, layoutId, forceUpdatePositions]
    );

    const addItem = useCallback(() => {
        const newItemId = generateId();
        const newItem: SmartLayoutItem = {
            id: newItemId,
            title: '<p><span class="heading-text heading-3"></span></p>',
            text: '<p><span></span></p>',
        };
        const element = usePresentationStore
            .getState()
            .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
        usePresentationStore.getState().updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: {
                items: [...element.items, newItem],
            },
        });

        setTimeout(() => {
            forceUpdatePositions();
        }, 100);
    }, [elementId, presentationId, slideId, layoutId, forceUpdatePositions]);

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
            if (!isDraggingFromSameLayout) return;

            e.preventDefault();

            const itemElement = document.querySelector(`[data-smart-layout-item-id="${targetItemId}"]`);
            if (!itemElement) return;

            const rect = itemElement.getBoundingClientRect();
            const isLeft = e.clientY < rect.top + rect.height / 2;

            setDropIndicator({
                itemId: targetItemId,
                position: isLeft ? 'left' : 'right',
            });
        },
        [isDraggingFromSameLayout]
    );

    const handleDragLeave = useCallback(() => {
        setDropIndicator(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
            if (!isDraggingFromSameLayout || !dropIndicator) return;

            e.preventDefault();
            setDropIndicator(null);

            const draggedItemId = smartLayoutItemId;
            if (!draggedItemId || draggedItemId === targetItemId) return;

            const element = usePresentationStore
                .getState()
                .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;

            if (!element || !element.items) return;

            const sourceIndex = element.items.findIndex(item => item.id === draggedItemId);
            const targetIndex = element.items.findIndex(item => item.id === targetItemId);

            if (sourceIndex === -1 || targetIndex === -1) return;

            const newItems = [...element.items];
            const [draggedItem] = newItems.splice(sourceIndex, 1);

            let insertPosition = targetIndex;
            if (dropIndicator.position === 'right') {
                insertPosition = targetIndex + (sourceIndex < targetIndex ? 0 : 1);
            } else {
                insertPosition = targetIndex - (sourceIndex > targetIndex ? 0 : 1);
            }

            insertPosition = Math.max(0, Math.min(newItems.length, insertPosition));

            newItems.splice(insertPosition, 0, draggedItem);

            usePresentationStore.getState().updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    items: newItems,
                },
            });

            setTimeout(() => {
                forceUpdatePositions();
            }, 100);
        },
        [
            isDraggingFromSameLayout,
            dropIndicator,
            smartLayoutItemId,
            presentationId,
            slideId,
            layoutId,
            elementId,
            forceUpdatePositions,
        ]
    );

    const containerClasses = [
        styles.container,
        styles.verticalTimelineContainer,
        isFocused ? styles.focused : '',
        isFocused ? 'focused' : '',
        sides === 'two' ? styles.verticalTwoSides : styles.verticalOneSide,
    ].join(' ');

    const timelineHeight =
        elementPositions.length > 0
            ? elementPositions[elementPositions.length - 1].top + elementPositions[elementPositions.length - 1].height
            : 0;

    return (
        <div className={containerClasses} style={{ '--item-count': itemsIds.length } as React.CSSProperties}>
            <div className={styles.verticalTimelineWrapper} ref={containerRef}>
                {/* Timeline line and points */}
                <div
                    className={styles.verticalTimelineLine}
                    style={
                        {
                            '--timeline-color': timelineColor,
                            '--numbers-color': numbersColor,
                            height: timelineHeight,
                        } as React.CSSProperties
                    }
                >
                    {/* Main timeline line */}
                    <div className={styles.verticalTimelineMainLine} style={{ backgroundColor: timelineColor }} />

                    {/* Timeline points */}
                    {elementPositions.map((position, index) => (
                        <div
                            key={index}
                            className={`${styles.verticalTimelinePoint} ${showNumbers ? styles.verticalTimelinePointNumber : ''}`}
                            style={{
                                backgroundColor: timelineColor,
                                top: `${position.top + 2}px`, // Align with element top + 20px offset to be slightly below top border
                            }}
                            data-number={index + 1}
                        />
                    ))}
                </div>

                {/* Content items */}
                <div
                    className={styles.verticalTimelineContent}
                    style={{
                        height:
                            elementPositions.length > 0
                                ? `${Math.max(...elementPositions.map(p => p.top + p.height)) + 40}px`
                                : '100%',
                    }}
                >
                    {itemsIds.map((itemId, index) => (
                        <TimelineVerticalContent
                            key={itemId}
                            itemId={itemId}
                            _itemIndex={index}
                            _originalIndex={index}
                            isOnLeft={sides === 'two' ? index % 2 === 0 : false}
                            dropIndicator={dropIndicator}
                            timelineColor={timelineColor}
                            presentationId={presentationId}
                            slideId={slideId}
                            layoutId={layoutId}
                            elementId={elementId}
                            isReadOnly={isReadOnly}
                            tiptapRefs={tiptapRefs}
                            handleDragOver={handleDragOver}
                            handleDragLeave={handleDragLeave}
                            handleDrop={handleDrop}
                            addItem={addItem}
                            handleContentChange={handleContentChange}
                            showLines={showLines}
                            elementRef={elementRefs.current[itemId]}
                            isLastItem={index === itemsIds.length - 1}
                            position={elementPositions[index]}
                            sides={sides}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

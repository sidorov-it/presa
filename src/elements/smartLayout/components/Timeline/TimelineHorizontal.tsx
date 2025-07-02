import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { useDndStore } from '@/store/dndStore';
import { usePresentationStore } from '@/store/presentationStore';
import { TipTapRefs, SmartLayoutElement, SmartLayoutItem } from '@/types';
import { generateId } from '@/utils/id';
import React, { RefObject, useState, useRef, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import styles from './Timeline.module.css';
import TimelineContent from './TimelineContent';

export default function TimelineHorizontal({
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
    const [timelinePoints, setTimelinePoints] = useState<{ top: number }[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const elementRefs = useRef<{ [key: string]: RefObject<HTMLDivElement> }>({});

    const { direction, sides, showLines, timelineColor } = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement & {
                direction?: 'horizontal' | 'vertical';
                sides?: 'one' | 'two';
                showLines?: boolean;
                timelineColor?: string;
            };
            return {
                direction: element.direction || 'horizontal',
                sides: element.sides || 'one',
                showLines: element.showLines !== false, // Default to true
                timelineColor:
                    element.timelineColor || 'var(--presentation-primary-accent, var(--color-primary, #1e88e5))',
            };
        })
    );

    const align = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
            return element.align || 'left';
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

    // Calculate timeline point positions for vertical direction
    useEffect(() => {
        if (direction === 'vertical') {
            const updatePositions = () => {
                if (!containerRef.current) return;

                const containerRect = containerRef.current.getBoundingClientRect();
                const points: { top: number }[] = [];

                itemsIds.forEach(itemId => {
                    const elementRef = elementRefs.current[itemId];
                    if (elementRef?.current) {
                        const elementRect = elementRef.current.getBoundingClientRect();
                        const relativeTop = elementRect.top - containerRect.top;
                        points.push({ top: relativeTop });
                    } else {
                        // Fallback if ref not available
                        points.push({ top: 0 });
                    }
                });

                setTimelinePoints(points);
            };

            // Update positions after elements are rendered
            const timeoutId = setTimeout(updatePositions, 200);

            // Also update on resize and content changes
            const resizeObserver = new ResizeObserver(() => {
                setTimeout(updatePositions, 50);
            });

            if (containerRef.current) {
                resizeObserver.observe(containerRef.current);
            }

            return () => {
                clearTimeout(timeoutId);
                resizeObserver.disconnect();
            };
        } else {
            // Reset timeline points when switching to horizontal direction
            setTimelinePoints([]);
        }
    }, [direction, itemsIds]);

    // Force re-render when direction or sides changes to ensure proper layout
    useEffect(() => {
        // Small delay to ensure CSS classes are applied
        const timeoutId = setTimeout(() => {
            if (containerRef.current) {
                // Trigger a reflow to ensure proper layout
                containerRef.current.style.display = 'none';
                void containerRef.current.offsetHeight; // Trigger reflow
                containerRef.current.style.display = '';
            }
        }, 50);

        return () => clearTimeout(timeoutId);
    }, [direction, sides]);

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
        },
        [elementId, presentationId, slideId, layoutId]
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
    }, [elementId, presentationId, slideId, layoutId]);

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
            if (!isDraggingFromSameLayout) return;

            e.preventDefault();

            const itemElement = document.querySelector(`[data-smart-layout-item-id="${targetItemId}"]`);
            if (!itemElement) return;

            const rect = itemElement.getBoundingClientRect();
            const isLeft = e.clientX < rect.left + rect.width / 2;

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
        },
        [isDraggingFromSameLayout, dropIndicator, smartLayoutItemId, presentationId, slideId, layoutId, elementId]
    );

    // Determine container class based on direction and sides
    const containerClasses: string[] = [styles.container, isFocused ? styles.focused : ''];

    if (direction === 'horizontal') {
        if (sides === 'two') {
            containerClasses.push(styles.horizontalTwoSides);
        } else {
            containerClasses.push(styles.horizontalOneSide);
        }
    } else {
        if (sides === 'two') {
            containerClasses.push(styles.verticalTwoSides);
        } else {
            containerClasses.push(styles.verticalOneSide);
        }
    }

    if (isFocused) {
        containerClasses.push('focused');
    }

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

    const getSecondLineStyle = () => {
        const baseStyle = {};

        if (sides === 'two') {
            if (direction === 'horizontal') {
                // Don't apply margin for horizontal two-sides - positioning is handled in element styles
                return baseStyle;
            } else if (direction === 'vertical') {
                return {
                    ...baseStyle,
                    marginTop: `calc(100% / ${maxItemsCount} / 2)`,
                };
            }
        }

        return baseStyle;
    };

    return (
        <div className={containerClasses.join(' ')} style={{ '--item-count': itemsIds.length } as React.CSSProperties}>
            <div
                className={`${styles.flexContainer} ${direction === 'horizontal' ? styles.horizontal : styles.vertical}`}
                ref={containerRef}
            >
                <div className={styles.firstLine}>
                    {firstLineItems.map((itemId, index) => {
                        return (
                            <TimelineContent
                                key={itemId || `first-empty-${index}`}
                                itemId={itemId}
                                direction={direction}
                                itemsIds={itemsIds}
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
                                align={align}
                                maxItemsCount={maxItemsCount}
                                index={index}
                                sides={sides}
                                className={styles.itemWrapperAlignBottom}
                                elementRef={elementRefs.current[itemId || '']}
                            />
                        );
                    })}
                </div>

                <div
                    className={styles.timelineLineItems}
                    style={
                        {
                            '--timeline-color': timelineColor,
                            ...(direction === 'vertical' && { height: containerRef.current?.clientHeight }),
                        } as React.CSSProperties
                    }
                >
                    <div className={styles.timelineLineItemInvisible}></div>
                    {Array(itemsIds.length)
                        .fill(null)
                        .map((_, index) => {
                            const classNames = [styles.timelineLineItem];

                            if (showLines) {
                                if (direction === 'horizontal' && sides === 'one') {
                                    classNames.push(styles.horizontalConnectionLine);
                                } else if (direction === 'vertical' && sides === 'one') {
                                    classNames.push(styles.verticalConnectionLine);
                                } else if (direction === 'horizontal' && sides === 'two') {
                                    classNames.push(styles.horizontalTwoSidesConnectionLine);
                                } else if (direction === 'vertical' && sides === 'two') {
                                    classNames.push(styles.verticalTwoSidesConnectionLine);
                                }
                            }

                            // Different positioning logic for "one side" vs "two sides" and direction
                            let positionStyle;

                            if (direction === 'horizontal') {
                                const timelinePointPosition =
                                    sides === 'one'
                                        ? `calc((100% / ${itemsIds.length}) * ${index} + (100% / ${itemsIds.length}) / 2 - 13px)` // Center of each block
                                        : `calc((100% / ${itemsIds.length + 1}) * ${index + 1} - 13px)`; // Equal distances from borders
                                positionStyle = { left: timelinePointPosition };
                            } else {
                                // For vertical direction, position points at the top of corresponding elements
                                if (timelinePoints[index]) {
                                    positionStyle = { top: `${timelinePoints[index].top + 10}px` };
                                } else {
                                    // Fallback to equal distribution if element positions not available
                                    const topPosition =
                                        sides === 'one'
                                            ? `calc((100% / ${itemsIds.length}) * ${index} + (100% / ${itemsIds.length}) / 2)`
                                            : `calc((100% / ${itemsIds.length + 1}) * ${index + 1})`;
                                    positionStyle = { top: topPosition };
                                }
                            }

                            return <div key={index} className={classNames.join(' ')} style={positionStyle} />;
                        })}
                    <div className={styles.timelineLineItemInvisible}></div>
                </div>
                <div className={styles.secondLine} style={getSecondLineStyle()}>
                    {secondLineItems.map((itemId, index) => {
                        return (
                            <TimelineContent
                                key={itemId || `second-empty-${index}`}
                                itemId={itemId}
                                direction={direction}
                                itemsIds={itemsIds}
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
                                align={align}
                                maxItemsCount={maxItemsCount}
                                index={index}
                                sides={sides}
                                isSecondLine={true}
                                className={styles.itemWrapperAlignTop}
                                elementRef={elementRefs.current[itemId || '']}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

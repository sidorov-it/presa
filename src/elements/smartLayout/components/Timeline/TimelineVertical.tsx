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
import { Tiptap } from '@/components/tiptap/Tiptap';
import { HiPlus } from 'react-icons/hi';
import ItemWrapper from '../ItemWrapper/ItemWrapper';

interface ElementPosition {
    top: number;
    height: number;
    side: 'left' | 'right';
}

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
    align,
    showLines,
    elementRef,
    isLastItem,
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
    align: 'left' | 'center' | 'right';
    showLines: boolean;
    elementRef: RefObject<HTMLDivElement>;
    isLastItem: boolean;
}) => {
    return (
        <div
            className={`${styles.verticalTimelineItem} ${isOnLeft ? styles.leftSide : styles.rightSide}`}
            onDragOver={e => handleDragOver(e, itemId)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, itemId)}
            data-smart-layout-item-id={itemId}
            ref={elementRef}
        >
            {dropIndicator && dropIndicator.itemId === itemId && (
                <div
                    className={`${styles.dropIndicator} ${dropIndicator.position === 'left' ? styles.left : styles.right}`}
                    style={{ backgroundColor: timelineColor }}
                />
            )}

            {showLines && (
                <div
                    className={`${styles.verticalConnectionLine} ${isOnLeft ? styles.toRight : styles.toLeft}`}
                    style={{ backgroundColor: timelineColor }}
                />
            )}

            <ItemWrapper
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
    const [elementPositions, setElementPositions] = useState<ElementPosition[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const elementRefs = useRef<{ [key: string]: RefObject<HTMLDivElement> }>({});

    const { sides, showLines, timelineColor } = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement & {
                sides?: 'one' | 'two';
                showLines?: boolean;
                timelineColor?: string;
            };
            return {
                sides: element.sides || 'one',
                showLines: element.showLines !== false,
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

            const containerRect = containerRef.current.getBoundingClientRect();
            const positions: ElementPosition[] = [];
            let cumulativeHeight = 0;

            itemsIds.forEach((itemId, index) => {
                const elementRef = elementRefs.current[itemId];
                if (elementRef?.current) {
                    const elementRect = elementRef.current.getBoundingClientRect();
                    const relativeTop = elementRect.top - containerRect.top;
                    const height = elementRect.height;

                    const side = getSideForIndex(index);
                    positions.push({
                        top: Math.max(cumulativeHeight, relativeTop),
                        height,
                        side,
                    });

                    // For two sides, ensure elements don't overlap vertically
                    if (sides === 'two') {
                        cumulativeHeight = Math.max(cumulativeHeight, relativeTop + height + 40); // 40px gap
                    }
                } else {
                    const side = getSideForIndex(index);
                    positions.push({
                        top: cumulativeHeight,
                        height: 60, // Default height
                        side,
                    });
                    cumulativeHeight += 100; // Default spacing
                }
            });

            setElementPositions(positions);
        };

        const timeoutId = setTimeout(updatePositions, 200);

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
    }, [itemsIds, sides]);

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
        },
        [isDraggingFromSameLayout, dropIndicator, smartLayoutItemId, presentationId, slideId, layoutId, elementId]
    );

    const containerClasses = [
        styles.container,
        styles.verticalTimelineContainer,
        isFocused ? styles.focused : '',
        sides === 'two' ? styles.verticalTwoSides : styles.verticalOneSide,
    ].join(' ');

    return (
        <div className={containerClasses} style={{ '--item-count': itemsIds.length } as React.CSSProperties}>
            <div className={styles.verticalTimelineWrapper} ref={containerRef}>
                {/* Timeline line and points */}
                <div
                    className={styles.verticalTimelineLine}
                    style={
                        {
                            '--timeline-color': timelineColor,
                            height: containerRef.current?.scrollHeight || '100%',
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
                                top: `${position.top + 10}px`, // Align with element top + small offset
                            }}
                        />
                    ))}
                </div>

                {/* Content items */}
                <div className={styles.verticalTimelineContent}>
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
                            align={align}
                            showLines={showLines}
                            elementRef={elementRefs.current[itemId]}
                            isLastItem={index === itemsIds.length - 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

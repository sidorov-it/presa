/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RefObject, useCallback, useState } from 'react';
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
    showLines,
    index,
    maxItemsCount,
    sides,
    isSecondLine,
    className,
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
    showLines: boolean;
    index: number;
    maxItemsCount: number;
    className?: string;
    sides: 'one' | 'two';
    isSecondLine?: boolean;
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
        const baseStyle = {
            width: direction === 'horizontal' ? `calc(100% / ${maxItemsCount} - 1em)` : '100%',
        };

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
                renderMenuComponent={menuPosition => {
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

export default function Timeline({
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

    const { columnSize, direction, sides, showNumbers, showLines, timelineColor } = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement & {
                direction?: 'horizontal' | 'vertical';
                sides?: 'one' | 'two';
                showNumbers?: boolean;
                showLines?: boolean;
                timelineColor?: string;
            };
            return {
                columnSize: element.columnSize,
                direction: element.direction || 'horizontal',
                sides: element.sides || 'one',
                showNumbers: element.showNumbers || false,
                showLines: element.showLines !== false, // Default to true
                timelineColor: element.timelineColor || '#1e88e5',
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

    return (
        <div className={containerClasses.join(' ')} style={{ '--item-count': itemsIds.length } as React.CSSProperties}>
            <div
                className={`${styles.flexContainer} ${direction === 'horizontal' ? styles.horizontal : styles.vertical}`}
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
                                showLines={showLines}
                                maxItemsCount={maxItemsCount}
                                index={index}
                                sides={sides}
                                className={styles.itemWrapperAlignBottom}
                            />
                        );
                    })}
                </div>

                <div className={styles.timelineLineItems}>
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

                            // Different positioning logic for "one side" vs "two sides"
                            const timelinePointPosition =
                                sides === 'one'
                                    ? `calc((100% / ${itemsIds.length}) * ${index} + (100% / ${itemsIds.length}) / 2)` // Center of each block
                                    : `calc((100% / ${itemsIds.length + 1}) * ${index + 1})`; // Equal distances from borders

                            return (
                                <div
                                    key={index}
                                    className={classNames.join(' ')}
                                    style={{
                                        left: timelinePointPosition,
                                    }}
                                />
                            );
                        })}
                    <div className={styles.timelineLineItemInvisible}></div>
                </div>
                <div className={styles.secondLine}>
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
                                showLines={showLines}
                                maxItemsCount={maxItemsCount}
                                index={index}
                                sides={sides}
                                isSecondLine={true}
                                className={styles.itemWrapperAlignTop}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

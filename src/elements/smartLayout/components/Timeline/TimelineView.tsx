/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RefObject } from 'react';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import styles from './Timeline.module.css';

export default function TimelineView({
    element,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
}: {
    element: SmartLayoutElement & { direction?: 'horizontal' | 'vertical' };
    tiptapRefs: RefObject<TipTapRefs> | null;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
}) {
    const isReadOnly = true;
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
    const timelineColor = element.timelineColor || '#1e88e5';

    const itemsIds = element.items?.map(item => item.id) || [];

    // Determine container class based on direction and sides
    const containerClasses = [
        styles.container,
        isFocused ? styles.focused : '',
        direction === 'horizontal'
            ? sides === 'two'
                ? styles.horizontalTwoSides
                : styles.horizontalOneSide
            : sides === 'two'
                ? styles.verticalTwoSides
                : styles.verticalOneSide,
    ].join(' ');

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
        
        firstLineItems = Array(totalSlots).fill(null).map((_, i) => 
            i < oddIndexedItems.length ? oddIndexedItems[i] : null
        );
        
        secondLineItems = Array(totalSlots).fill(null).map((_, i) => 
            i < evenIndexedItems.length ? evenIndexedItems[i] : null
        );
        
        maxItemsCount = totalSlots;
    }

    const renderTimelineItem = (itemId: string | null, index: number) => {
        if (itemId === null) {
            return (
                <div 
                    key={`empty-${index}`}
                    className={styles.itemContainer}
                    style={{
                        width: direction === 'horizontal' ? `calc(100% / ${maxItemsCount} - 1em)` : '100%',
                        visibility: 'hidden'
                    }}
                />
            );
        }

        const item = element.items?.find(i => i.id === itemId);
        if (!item) return null;
        
        return (
            <div
                key={itemId}
                className={styles.itemContainer}
                data-smart-layout-item-id={itemId}
                style={{
                    width: direction === 'horizontal' ? `calc(100% / ${maxItemsCount} - 1em)` : '100%',
                }}
            >
                <div
                    className={`${styles.textBox} ${align ? styles[align] : ''}`}
                    style={{ position: 'relative' }}
                >
                    {/* Connection line between timeline and content */}
                    {showLines && (
                        <div
                            className={`${styles.connectionLine} ${
                                direction === 'horizontal'
                                    ? styles.horizontalConnectionLine
                                    : styles.verticalConnectionLine
                            }`}
                            style={{ backgroundColor: timelineColor }}
                        />
                    )}

                    {/* Timeline marker */}
                    <div className={styles.marker} style={{ backgroundColor: timelineColor }}>
                        {showNumbers && <div className={styles.markerNumber}>{index + 1}</div>}
                    </div>

                    <Tiptap
                        isReadOnly={isReadOnly}
                        defaultContent={item.title}
                        elementId={element.id}
                        tiptapRefs={tiptapRefs}
                        id={element.id}
                        placeholder="Заголовок"
                        onContentChange={() => {}}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isHideSlashMenu={false}
                    />
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
                        isHideSlashMenu={false}
                        onEnterPressed={() => {
                            return true;
                        }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className={containerClasses}>
            <div className={`${styles.flexContainer} ${direction === 'horizontal' ? styles.horizontal : styles.vertical}`}>
                <div className={styles.firstLine}>
                    {firstLineItems.map((itemId, index) => renderTimelineItem(itemId, index))}
                </div>

                <div className={styles.timelineLineItems}>
                    <div className={styles.timelineLineItemInvisible}></div>
                    {Array(maxItemsCount).fill(null).map((_, index) => {
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

                        return (
                            <div
                                key={index}
                                className={classNames.join(' ')}
                                style={{
                                    left: `calc((100% / ${maxItemsCount + 1}) * ${index + 1})`,
                                }}
                            />
                        );
                    })}
                    <div className={styles.timelineLineItemInvisible}></div>
                </div>

                <div className={styles.secondLine}>
                    {secondLineItems.map((itemId, index) => renderTimelineItem(itemId, index))}
                </div>
            </div>
        </div>
    );
}

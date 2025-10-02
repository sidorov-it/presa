/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RefObject, useCallback, useMemo, useState } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, SmartLayoutItem, TipTapRefs } from '@/types';
import { generateId } from '@/utils/id';
import { HiPlus } from 'react-icons/hi2';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import { getContrastingTextColor } from '@/utils/themeUtils';
import ItemWrapper from '../ItemWrapper/ItemWrapper';
import TextBoxesMenu from './TextBoxesMenu';

import styles from './TextBoxes.module.css';
import { useDndStore } from '@/store/dndStore';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { useThemeStore } from '@/store/themeStore';
import { useShallow } from 'zustand/react/shallow';

export default function TextBoxes({
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
    // const source = useDndStore(state => state.state.source);
    const isDraggingFromSameLayout = useDndStore(
        state =>
            state.state.dragState &&
            state.state.source.elementId === elementId &&
            state.state.source.layoutId === layoutId &&
            !!state.state.source.smartLayoutItemId
    );

    const customTextColors: string[] = useThemeStore(
        useShallow(state => {
            if (
                state.currentTheme?.design?.blocks?.blockFillColorsType === 'custom' &&
                state.currentTheme?.design?.blocks?.blockBackgroundCustomColors?.length > 0 &&
                state.currentTheme?.design?.blocks?.backgroundBlockFillType !== 'none'
            ) {
                const colors: string[] = [];
                state.currentTheme?.design?.blocks?.blockBackgroundCustomColors.map(color => {
                    const textColor = getContrastingTextColor(color);
                    colors.push(textColor);
                });
                return colors;
            } else if (state.currentTheme?.design?.blocks?.blockFillColorsType === 'primary') {
                const textColor = getContrastingTextColor(state.currentTheme?.colors.primaryAccent);
                return [textColor];
            }
            return [];
        })
    );

    // const isDraggingFromSameLayout = useCallback(() => {
    //     return (
    //         dragState === 'dragging' &&
    //         source.elementId === elementId &&
    //         source.layoutId === layoutId &&
    //         !!source.smartLayoutItemId
    //     );
    // }, [dragState, source, elementId, layoutId]);

    const [dropIndicator, setDropIndicator] = useState<{ itemId: string; position: 'left' | 'right' } | null>(null);

    const element = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement
    );

    const columnSize = useMemo(() => {
        if (!element) return 1;

        let columnSize = (element as SmartLayoutElement).columnSize;
        const items = (element as SmartLayoutElement).items || [];

        if (items.length === 1) {
            columnSize = 4;
        } else if (items.length === 2 && columnSize > 2) {
            columnSize = 3;
        } else if (items.length === 3 && columnSize > 3) {
            columnSize = 2;
        }
        return columnSize;
    }, [element]);

    const itemsIds = useMemo(() => {
        return element?.items?.map(item => item.id) || [];
    }, [element]);

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

    // Check if dragged item is from same smartLayout
    // const isDraggingFromSameLayout = useCallback(() => {
    //     return (
    //         dragState === 'dragging' &&
    //         source.elementId === elementId &&
    //         source.layoutId === layoutId &&
    //         !!source.smartLayoutItemId
    //     );
    // }, [dragState, source, elementId, layoutId]);

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
            // Only allow if dragged from same smartLayout
            if (!isDraggingFromSameLayout) return;

            e.preventDefault();

            // Get the item DOM element
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

            // Get current element with items
            const element = usePresentationStore
                .getState()
                .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;

            if (!element || !element.items) return;

            // Get indices of source and target
            const sourceIndex = element.items.findIndex(item => item.id === draggedItemId);
            const targetIndex = element.items.findIndex(item => item.id === targetItemId);

            if (sourceIndex === -1 || targetIndex === -1) return;

            // Create new items array by reordering
            const newItems = [...element.items];
            const [draggedItem] = newItems.splice(sourceIndex, 1);

            // Calculate insert position based on drop indicator position
            let insertPosition = targetIndex;
            if (dropIndicator.position === 'right') {
                insertPosition = targetIndex + (sourceIndex < targetIndex ? 0 : 1);
            } else {
                insertPosition = targetIndex - (sourceIndex > targetIndex ? 0 : 1);
            }

            // Ensure valid bounds
            insertPosition = Math.max(0, Math.min(newItems.length, insertPosition));

            // Insert item at new position
            newItems.splice(insertPosition, 0, draggedItem);

            // Update the layout with new order
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

    let elementWidth: string;

    if (columnSize === 4) {
        elementWidth = `25%`;
    } else if (columnSize === 3) {
        elementWidth = '33.33%';
    } else if (columnSize === 2) {
        elementWidth = '50%';
    } else if (columnSize === 1) {
        elementWidth = '100%';
    }

    return (
        <div className={`${styles.container} ${isFocused ? styles.focused : ''}`}>
            {itemsIds?.map((itemId, index) => {
                const item = element.items?.find(item => item.id === itemId);
                const backgroundColor = item?.backgroundColor;
                const style: React.CSSProperties = {};
                if (backgroundColor) {
                    style.backgroundColor = backgroundColor;
                    const contrastColor = getContrastingTextColor(backgroundColor);
                    // @ts-ignore
                    style['--presentation-text-color'] = contrastColor;
                    // @ts-ignore
                    style['--presentation-heading-color'] = contrastColor;
                    // @ts-ignore
                    style['--presentation-block-background-subtle'] = backgroundColor;
                    // @ts-ignore
                    style['--presentation-block-text-color-subtle'] = contrastColor;
                }

                const color = customTextColors[index % customTextColors.length];
                return (
                    <div
                        key={itemId}
                        className={styles.itemBackground}
                        data-smart-layout-item-id={itemId}
                        style={
                            {
                                width: `calc(${elementWidth} - 1em)`,
                                borderColor: 'red',
                                '--presentation-heading-color': color,
                                '--presentation-text-color': color,
                            } as React.CSSProperties & {
                                '--presentation-heading-color': string;
                                '--presentation-text-color': string;
                            }
                        }
                        onDragOver={e => handleDragOver(e, itemId)}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, itemId)}
                    >
                        {dropIndicator && dropIndicator.itemId === itemId && (
                            <div
                                className={`${styles.dropIndicator} ${
                                    dropIndicator.position === 'left' ? styles.left : styles.right
                                }`}
                            />
                        )}
                        <ItemWrapper
                            className={styles.item}
                            presentationId={presentationId}
                            itemId={itemId}
                            slideId={slideId}
                            layoutId={layoutId}
                            elementId={elementId}
                            renderMenuComponent={menuPosition => {
                                return menuPosition ? (
                                    <TextBoxesMenu
                                        presentationId={presentationId}
                                        position={menuPosition}
                                        itemId={itemId}
                                        slideId={slideId}
                                        layoutId={layoutId}
                                        elementId={elementId}
                                    />
                                ) : null;
                            }}
                        >
                            <div
                                className={`${styles.textBox} ${element?.align ? styles[element.align] : ''}`}
                                style={style}
                            >
                                <div className={styles.title}>
                                    <Tiptap
                                        isReadOnly={isReadOnly}
                                        elementId={elementId}
                                        tiptapRefs={tiptapRefs}
                                        id={elementId}
                                        placeholder="Заголовок"
                                        onContentChange={handleContentChange(itemId, 'title')}
                                        presentationId={presentationId}
                                        slideId={slideId}
                                        layoutId={layoutId}
                                        customRefKey={`title-${elementId}-${itemId}`}
                                        smartLayoutItemId={`title-${elementId}-${itemId}`}
                                        isHideSlashMenu={true}
                                        isInnerTiptap={true}
                                        standardEnterBehavior={true}
                                    />
                                </div>
                                <div className={styles.content}>
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
                                        smartLayoutItemId={`text-${elementId}-${itemId}`}
                                        isHideSlashMenu={true}
                                        isInnerTiptap={true}
                                        standardEnterBehavior={true}
                                    />
                                </div>
                            </div>
                            {!isReadOnly && index === itemsIds.length - 1 && (
                                <div className={styles.addButton} onClick={addItem}>
                                    <HiPlus style={{ width: '1rem', height: '1rem' }} />
                                </div>
                            )}
                        </ItemWrapper>
                    </div>
                );
            })}
        </div>
    );
}

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

    const itemsIds = element.items?.map(item => item.id) || [];

    let elementWidth: string;

    if (columnSize === 4) {
        elementWidth = `25%`;
    } else if (columnSize === 3) {
        elementWidth = '33.33%';
    } else if (columnSize === 2) {
        elementWidth = '50%';
    } else {
        elementWidth = '100%';
    }

    return (
        <div className={`${styles.container} ${isFocused ? styles.focused : ''}`}>
            {itemsIds?.map((itemId, index) => {
                const item = element.items?.find(i => i.id === itemId);
                if (!item) return null;
                return (
                    <div
                        key={itemId}
                        className={styles.itemContainer}
                        data-smart-layout-item-id={itemId}
                        style={{
                            width: direction === 'horizontal' ? `calc(${elementWidth} - 1em)` : '100%',
                            marginLeft: direction === 'horizontal' ? `${index}rem` : undefined,
                            marginTop: direction === 'vertical' ? `${index}rem` : undefined,
                        }}
                    >
                        <div className={`${styles.textBox} ${align ? styles[align] : ''}`} style={{ position: 'relative' }}>
                            <div className={styles.marker} />
                            {index < itemsIds.length - 1 && (
                                <div className={direction === 'horizontal' ? styles.lineHorizontal : styles.lineVertical} />
                            )}
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
            })}
        </div>
    );
}

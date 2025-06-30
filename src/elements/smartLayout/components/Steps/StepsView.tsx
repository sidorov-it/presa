/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RefObject } from 'react';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import styles from './Steps.module.css';

export default function StepsView({
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
                        }}
                    >
                        <div
                            className={`${styles.textBox} ${align ? styles[align] : ''}`}
                            style={{
                                paddingLeft: direction === 'vertical' ? `${index * 32}px` : undefined,
                                paddingTop: direction === 'horizontal' ? `${index * 32}px` : undefined,
                            }}
                        >
                            <div className={styles.step} />
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
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

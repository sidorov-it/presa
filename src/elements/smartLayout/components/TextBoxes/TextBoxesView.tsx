/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RefObject } from 'react';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';

import styles from './TextBoxes.module.css';
import wrapperStyles from '../ItemWrapper/ItemWrapper.module.css';

export default function TextBoxesView({
    element,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
}: {
    element: SmartLayoutElement;
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

    const align = element.align || 'left';

    const itemsIds = element.items?.map(item => item.id) || [];

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
            {itemsIds?.map(itemId => {
                const item = element.items?.find(item => item.id === itemId);
                if (!item) return null;

                return (
                    <div
                        key={itemId}
                        className={styles.itemContainer}
                        data-smart-layout-item-id={itemId}
                        style={{
                            width: `calc(${elementWidth} - 1em)`,
                        }}
                    >
                        <div className={`${wrapperStyles.item} ${align ? wrapperStyles[align] : ''}`}>
                            <div className={`${styles.textBox} ${align ? styles[align] : ''}`}>
                                <div className={styles.title}>
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
                                        // customRefKey={`title-${element.id}-${itemId}`}
                                        isHideSlashMenu={false}
                                    />
                                </div>
                                <div className={styles.content}>
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
                                        // customRefKey={`text-${element.id}-${itemId}`}
                                        isHideSlashMenu={false}
                                        onEnterPressed={() => {
                                            return true;
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* </ItemWrapper> */}
                    </div>
                );
            })}
        </div>
    );
}

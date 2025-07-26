/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RefObject, useMemo } from 'react';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';

import styles from './TextBoxes.module.css';
import { getContrastingTextColor, getSubtleColor } from '@/utils/themeUtils';

export default function TextBoxesView({
    element,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
    blockFillColorsType = 'primary',
    blockBackgroundCustomColors = [],
    primaryAccentColor,
    backgroundBlockFillType,
}: {
    element: SmartLayoutElement;
    tiptapRefs: RefObject<TipTapRefs> | null;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
    blockFillColorsType?: string;
    blockBackgroundCustomColors?: string[];
    primaryAccentColor?: string;
    backgroundBlockFillType?: string;
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

    const customColors: string[] = useMemo(() => {
        if (backgroundBlockFillType === 'none') {
            return [];
        }
        if (blockFillColorsType === 'custom' && blockBackgroundCustomColors?.length > 0) {
            const colors: string[] = [];
            blockBackgroundCustomColors.map(color => {
                const textColor = getContrastingTextColor(color);
                colors.push(textColor);
            });
            return colors;
        } else if (blockFillColorsType === 'subtle') {
            const textColor = getContrastingTextColor(getSubtleColor(primaryAccentColor || '#ffffff'));
            return [textColor];
        } else if (blockFillColorsType === 'primary') {
            const textColor = getContrastingTextColor(primaryAccentColor || '#ffffff');
            return [textColor];
        }
        return [];
    }, [blockFillColorsType, blockBackgroundCustomColors, primaryAccentColor]);

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
            {itemsIds?.map((itemId, index) => {
                const item = element.items?.find(item => item.id === itemId);
                if (!item) return null;

                const backgroundColor = item?.backgroundColor;
                const style: React.CSSProperties & Record<string, string> = {};
                if (backgroundColor) {
                    style.backgroundColor = backgroundColor;
                    const contrastColor = getContrastingTextColor(backgroundColor);
                    style['--presentation-text-color'] = contrastColor;
                    style['--presentation-heading-color'] = contrastColor;
                    style['--presentation-block-text-color-subtle'] = contrastColor;
                }

                const color = customColors[index % customColors.length];

                const colorsStyle = color
                    ? {
                        '--presentation-block-text-color': color,
                        '--presentation-heading-color': color,
                        '--presentation-text-color': color,
                    }
                    : {};
                return (
                    <div
                        key={itemId}
                        className={`${styles.itemContainer}`}
                        data-smart-layout-item-id={itemId}
                        style={
                            {
                                width: `calc(${elementWidth} - 1em)`,
                                backgroundColor: element.backgroundColor || undefined,
                                color: element.textColor || undefined,
                                '--presentation-block-background-custom-type': blockFillColorsType,
                                '--presentation-block-background-custom-count': String(items.length),
                                ...colorsStyle,
                            } as React.CSSProperties & Record<string, string>
                        }
                    >
                        <div
                            className={`${styles.textBox} ${styles.item} ${align ? styles[align] : ''} ${styles.itemBackground}`}
                            style={style}
                        >
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
                                    isHideSlashMenu={false}
                                    isInnerTiptap={true}
                                    isHideEmpty={true}
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
                                    isInnerTiptap={true}
                                    isHideSlashMenu={false}
                                    isHideEmpty={true}
                                    onEnterPressed={() => {
                                        return true;
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

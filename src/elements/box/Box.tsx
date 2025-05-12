import { usePresentationStore } from '@/store/presentationStore';
import { BoxElement, TipTapRefs } from '@/types';
import { Box } from '@chakra-ui/react';
import { getElementConfig } from '../registry';
import Tiptap from '@/components/tiptap/Tiptap';
import { RefObject, useMemo, useState, useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import styles from './Box.module.css';
import { getBlockColors } from '@/utils/colors';
import { useThemeStore } from '@/store/themeStore';
import { BoxIconOptions } from '@/components/editor/Menus/BubbleMenus/BoxBubbleMenu/BoxIconOptions';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

export default function BoxComponent({
    elementId,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    dragHandleRef,
}: {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    dragHandleRef?: RefObject<HTMLDivElement>;
}) {
    const isReadOnly = useReadOnly();

    const element = usePresentationStore(
        useShallow(state => state.getElement(presentationId, slideId, layoutId, elementId) as BoxElement)
    );

    const { elementTypeId, iconType, customBackgroundColor } = element;

    const [fontSize, setFontSize] = useState<string | null>(null);

    useEffect(() => {
        const newFontSize = tiptapRefs.current!.editors[element.id]?.editor.getAttributes('textStyle').fontSize;
        if (typeof newFontSize === 'string') {
            setFontSize(newFontSize);
        } else if (newFontSize) {
            setFontSize(newFontSize?.fontSize);
        } else {
            setFontSize('1.125em');
        }
    }, [element.content, element.id, tiptapRefs]);

    const currentTheme = useThemeStore(state => state.currentTheme);

    const slideBgColor = currentTheme?.colors.slideBackground;

    const { blockBgColor, iconColor, textColor } = useMemo(
        () => getBlockColors(slideBgColor!, iconType!, { blockBgColor: customBackgroundColor }),
        [slideBgColor, customBackgroundColor, iconType]
    );

    const elementConfig = getElementConfig(elementTypeId);

    const IconInfo = BoxIconOptions.find(option => option.id === iconType);
    const IconComponent = IconInfo?.Icon;
    // const iconColor = IconInfo?.defaultIconColor;

    return (
        <Box
            bg={customBackgroundColor || blockBgColor || '#FFFFFF'}
            borderRadius="md"
            className={styles.box}
            style={{
                '--presentation-heading-color': textColor,
                '--presentation-text-color': textColor,
            }}
        >
            {IconComponent && (
                <span className={styles.icon} style={{ fontSize: fontSize }}>
                    <IconComponent color={iconColor} width={1.25} height={1.25} />
                </span>
            )}
            <Tiptap
                key={elementId}
                elementConfig={elementConfig}
                elementId={elementId}
                tiptapRefs={tiptapRefs}
                id={elementId}
                customBubbleMenuTrigger={dragHandleRef}
                presentationId={presentationId}
                slideId={slideId}
                layoutId={layoutId}
                standardEnterBehavior={true}
                isReadOnly={isReadOnly}
                onContentChange={(content: string) => {
                    usePresentationStore.getState().updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: {
                            content,
                        },
                        createHistoryEntry: true,
                        isTextElement: true,
                    });
                }}
            />
        </Box>
    );
}

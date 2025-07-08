import { BoxElement, TipTapRefs } from '@/types';
import { Theme } from '@/types/theme';
import { Box } from '@chakra-ui/react';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import { CSSProperties, RefObject, useEffect, useMemo, useState } from 'react';
import { BoxIconOptions } from '@/components/editor/Menus/BubbleMenus/BoxBubbleMenu/BoxIconOptions';
import styles from './Box.module.css';
import { getBlockColors } from '@/utils/colors';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { getElementConfig } from '@/utils/getElementConfig';

interface BoxComponentProps {
    element: BoxElement;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    dragHandleRef?: RefObject<HTMLDivElement>;
    theme: Theme | null | undefined;
    onContentChange?: (content: string) => void;
}

export default function BoxComponent({
    element,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    dragHandleRef,
    theme,
    onContentChange,
}: BoxComponentProps) {
    const isReadOnly = useReadOnly();
    const { elementTypeId, iconType, customBackgroundColor } = element;

    const [fontSize, setFontSize] = useState<string>('1.125em');

    useEffect(() => {
        const newFontSize = tiptapRefs.current?.editors[element.id]?.editor.getAttributes('textStyle').fontSize;
        if (typeof newFontSize === 'string') {
            setFontSize(newFontSize);
        } else if (newFontSize) {
            setFontSize(newFontSize?.fontSize);
        }
    }, [element.content, element.id, tiptapRefs]);

    // const slideBgColor = theme?.colors.slideBackground;
    const { blockBgColor, iconColor, textColor } = useMemo(
        () =>
            getBlockColors(theme?.colors.primaryAccent || '#000000', iconType || 'info-box', {
                blockBgColor: customBackgroundColor,
            }),
        [customBackgroundColor, iconType, theme]
    );

    const elementConfig = getElementConfig(elementTypeId);
    const IconInfo = BoxIconOptions.find(option => option.id === iconType);
    const IconComponent = IconInfo?.Icon;

    return (
        <Box
            bg={customBackgroundColor || blockBgColor || '#FFFFFF'}
            borderRadius="md"
            className={styles.box}
            style={
                {
                    color: textColor,
                    '--presentation-text-color': textColor,
                    '--presentation-block-background': customBackgroundColor || blockBgColor || '#FFFFFF',
                    '--presentation-block-background-custom-type': 'primary',
                    '--presentation-block-background-custom-count': '1',
                    '--presentation-block-background-custom-1': customBackgroundColor || blockBgColor || '#FFFFFF',
                } as CSSProperties
            }
        >
            {IconComponent && (
                <span className={styles.icon} style={{ fontSize: 'calc(1.125rem * var(--font-scale, 1))' }}>
                    <IconComponent color={iconColor} width={1.25} height={1.25} />
                </span>
            )}
            <Tiptap
                key={element.id}
                elementConfig={elementConfig}
                elementId={element.id}
                tiptapRefs={tiptapRefs}
                id={element.id}
                customBubbleMenuTrigger={dragHandleRef}
                presentationId={presentationId}
                slideId={slideId}
                layoutId={layoutId}
                standardEnterBehavior={true}
                isReadOnly={isReadOnly}
                onContentChange={content => {
                    onContentChange?.(content);
                }}
            />
        </Box>
    );
}

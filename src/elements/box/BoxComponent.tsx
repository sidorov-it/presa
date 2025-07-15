import { BoxElement, TipTapRefs } from '@/types';
import { Theme } from '@/types/theme';
import { Box } from '@chakra-ui/react';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import { CSSProperties, RefObject, useMemo } from 'react';
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
    slideBackground?: string;
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
    slideBackground,
    onContentChange,
}: BoxComponentProps) {
    const isReadOnly = useReadOnly();
    const { elementTypeId, iconType, customBackgroundColor } = element;

    // const slideBgColor = theme?.colors.slideBackground;
    const { blockBgColor, iconColor, textColor } = useMemo(
        () =>
            getBlockColors(slideBackground || theme?.colors.slideBackground || '#000000', iconType || 'info-box', {
                // blockBgColor: customBackgroundColor,
                blockBgColor: element.customBackgroundColor || element.backgroundColor,
                iconColor: (element as any).iconColor,
                textColor: (element as any).textColor,


            }),
        [customBackgroundColor, iconType, theme, element.customBackgroundColor, element.backgroundColor, element.iconColor, element.textColor]
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
                <div className={styles.iconContainer}>
                    <span className={styles.icon} style={{ fontSize: 'calc(1.125rem * var(--font-scale, 1))' }}>
                        <IconComponent color={iconColor} width={1.25} height={1.25} />
                    </span>
                </div>
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
                isInnerTiptap={true}
            />
        </Box>
    );
}

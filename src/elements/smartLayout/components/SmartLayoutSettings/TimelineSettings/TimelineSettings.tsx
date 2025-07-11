'use client';
import SmartLayoutTemplateSelector from '@/components/settings/SmartLayoutTemplateSelector/SmartLayoutTemplateSelector';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, SmartLayoutType, TipTapRefs } from '@/types';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import { DeleteIcon } from '@/components/icons';
import { useHistoryStore } from '@/store/historyStore';
import IconToggle from '@/components/settings/IconToggle/IconToggle';
import { FaTimeline } from 'react-icons/fa6';
import { GoHorizontalRule } from 'react-icons/go';

import styles from './TimelineSettings.module.css';
import { LuArrowDown, LuArrowRight, LuListOrdered } from 'react-icons/lu';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import { getContrastingTextColor } from '@/utils/themeUtils';
import { ElementRegistry } from '@/elements/commonRegisrty';

export default function TimelineSettings({
    element,
    slideId,
    layoutId,
    elementId,
    presentationId,
    tiptapRefs,
}: {
    element: SmartLayoutElement & { direction?: 'horizontal' | 'vertical' };
    slideId: string;
    layoutId: string;
    elementId: string;
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}) {
    const updateElement = usePresentationStore(state => state.updateElement);
    const elementConfig = useMemo(
        () => Object.values(ElementRegistry).find(el => element.elementVariant === el.props.elementVariant),
        [element.elementVariant]
    );

    const handleColorChange = (timelineColor: string) => {
        const element = usePresentationStore
            .getState()
            .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
        if (!element) return;

        const numbersColor = getContrastingTextColor(timelineColor);

        usePresentationStore.getState().updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: {
                timelineColor,
                numbersColor,
            },
        });
    };

    const handleColorReset = useCallback(() => {
        const defaultTimelineColor = elementConfig?.props?.backgroundColor;
        const defaultNumbersColor = getContrastingTextColor(defaultTimelineColor);

        updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: {
                timelineColor: defaultTimelineColor,
                numbersColor: defaultNumbersColor,
            },
        });
    }, [elementConfig, presentationId, slideId, layoutId, elementId, updateElement]);

    return (
        <>
            <SmartLayoutTemplateSelector
                elementVariant={element.elementVariant || 'grid'}
                setElementVariant={value => {
                    updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: { elementVariant: value as SmartLayoutType },
                    });
                }}
            />

            <div className={styles.buttons}>
                <IconToggle
                    icon={element.direction === 'horizontal' ? <LuArrowDown /> : <LuArrowRight />}
                    isEnabled={false}
                    onToggle={() => {
                        updateElement({
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            data: { direction: element.direction === 'horizontal' ? 'vertical' : 'horizontal' },
                        });
                    }}
                    ariaLabel={element.direction === 'horizontal' ? 'Горизонтально' : 'Вертикально'}
                />

                {/* <SmartLayoutDirectionSelector
                    direction={(element as any).direction || 'horizontal'}
                    setDirection={value => {
                        updateElement({
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            data: { direction: value },
                        });
                    }}
                /> */}
                {/*
                <TimelineSidesSelector
                    sides={element.sides || 'one'}
                    setSides={value => {
                        updateElement({
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            data: { sides: value },
                        });
                    }}
                /> */}

                <IconToggle
                    // icon={<SidesIcon />}
                    icon={<FaTimeline />}
                    isEnabled={element.sides === 'one'}
                    onToggle={() => {
                        updateElement({
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            data: { sides: element.sides === 'one' ? 'two' : 'one' },
                        });
                    }}
                    ariaLabel={'С двух сторон'}
                />

                <IconToggle
                    icon={<LuListOrdered />}
                    isEnabled={element.showNumbers || false}
                    onToggle={() => {
                        updateElement({
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            data: { showNumbers: !element.showNumbers },
                        });
                    }}
                    ariaLabel="Показывать нумерацию"
                />
                {/* <TimelineNumberingSelector
                    showNumbers={element.showNumbers || false}
                    setShowNumbers={value => {
                        updateElement({
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            data: { showNumbers: value },
                        });
                    }}
                />*/}

                <IconToggle
                    icon={<GoHorizontalRule />}
                    isEnabled={!!element.showLines}
                    onToggle={() => {
                        updateElement({
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            data: { showLines: !element.showLines },
                        });
                    }}
                    ariaLabel="Показывать линии"
                />
                {/* <TimelineLinesSelector
                    icon={<RiLine />}
                    showLines={element.showLines !== false} // Default to true
                    setShowLines={value => {
                        updateElement({
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            data: { showLines: value },
                        });
                    }}
                /> */}

                <ColorPicker
                    initialColor={element.timelineColor}
                    onColorChange={handleColorChange}
                    mode="icon"
                    className={styles.button}
                    isShowResetColor={true}
                    onColorReset={handleColorReset}
                />

                <MenuItem
                    icon={<DeleteIcon />}
                    label="Удалить элемент"
                    onClick={() => {
                        usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);
                    }}
                />
            </div>
        </>
    );
}

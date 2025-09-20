import React, { RefObject, useCallback } from 'react';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import TextBoxesView from './components/TextBoxes/TextBoxesView';
import ImagesWithTextView from './components/ImagesWithText/ImagesWithTextView';
import StepsView from './components/Steps/StepsView';
import TimelineView from './components/Timeline/TimelineView';

interface SmartLayoutViewProps {
    element: SmartLayoutElement;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs> | null;
    isFocused: boolean;
    blockFillColorsType?: string;
    blockBackgroundCustomColors?: string[];
    primaryAccentColor?: string;
    backgroundBlockFillType?: string;
}

const SmartLayoutView: React.FC<SmartLayoutViewProps> = ({
    element,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    isFocused,
    blockFillColorsType,
    blockBackgroundCustomColors,
    primaryAccentColor,
    backgroundBlockFillType,
}) => {
    const elementVariant = element.elementVariant;

    const renderLayout = useCallback(() => {
        switch (elementVariant) {
            case 'images-with-text':
                return (
                    <ImagesWithTextView
                        element={element}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                    />
                );
            case 'text-boxes':
                return (
                    <TextBoxesView
                        element={element}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                        blockFillColorsType={blockFillColorsType}
                        primaryAccentColor={primaryAccentColor}
                        blockBackgroundCustomColors={blockBackgroundCustomColors}
                        backgroundBlockFillType={backgroundBlockFillType}
                    />
                );
            case 'steps':
                return (
                    <StepsView
                        element={element}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                    />
                );
            case 'timeline':
                return (
                    <TimelineView
                        element={element}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                    />
                );
            // case 'bullets':
            //     return renderBulletsList();
            // case 'numbers':
            //     return renderNumbersList();
            // case 'grid':
            //     return renderGrid();
            // case 'timeline':
            //     return renderTimeline();
            default:
                return (
                    <ImagesWithTextView
                        element={element}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                    />
                );
        }
    }, [
        elementVariant,
        element,
        tiptapRefs,
        presentationId,
        slideId,
        layoutId,
        isFocused,
        blockFillColorsType,
        blockBackgroundCustomColors,
        primaryAccentColor,
    ]);

    return (
        <div
            style={{
                paddingLeft: '21px',
                marginLeft: '-17px',
                paddingRight: '21px',
            }}
        >
            {renderLayout()}
        </div>
    );
};

export default SmartLayoutView;

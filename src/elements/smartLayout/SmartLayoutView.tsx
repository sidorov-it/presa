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
}

const SmartLayoutView: React.FC<SmartLayoutViewProps> = ({
    element,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    isFocused,
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
    }, [element, isFocused, layoutId, elementVariant, presentationId, slideId, tiptapRefs]);

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

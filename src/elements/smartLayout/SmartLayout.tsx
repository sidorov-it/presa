import React, { RefObject, useCallback } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import ImagesWithText from '@/elements/smartLayout/components/ImagesWithText/ImagesWithText';
import TextBoxes from '@/elements/smartLayout/components/TextBoxes/TextBoxes';

interface SmartLayoutProps {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    isFocused: boolean;
}

const SmartLayout: React.FC<SmartLayoutProps> = ({
    elementId,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    isFocused,
}) => {
    const elementVariant = usePresentationStore(store => {
        const element = store.getElement(presentationId, slideId, layoutId, elementId);
        return (element as SmartLayoutElement).elementVariant;
    });

    const renderLayout = useCallback(() => {
        switch (elementVariant) {
            case 'images-with-text':
                return (
                    <ImagesWithText
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                    />
                );
            case 'text-boxes':
                return (
                    <TextBoxes
                        elementId={elementId}
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
                    <ImagesWithText
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                    />
                );
        }
    }, [elementId, isFocused, layoutId, elementVariant, presentationId, slideId, tiptapRefs]);

    return (
        <div
            style={{
                paddingLeft: '21px',
                marginLeft: '-17px',
                paddingRight: '21px',
            }}
        >
            {renderLayout()}
            {/* <button onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-blue-500 hover:text-blue-600">
                <FaPlus className="w-4 h-4" />
                <span>Add item</span>
            </button> */}
        </div>
    );
};

export default SmartLayout;

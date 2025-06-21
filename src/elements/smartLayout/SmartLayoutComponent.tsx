import React, { RefObject, useCallback } from 'react';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import ImagesWithTextComponent from '@/elements/smartLayout/components/ImagesWithText/ImagesWithTextComponent';
import TextBoxesComponent from '@/elements/smartLayout/components/TextBoxes/TextBoxesComponent';

interface SmartLayoutComponentProps {
    element: SmartLayoutElement;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    isFocused: boolean;
    onUpdateElement?: (data: Partial<SmartLayoutElement>) => void;
}

const SmartLayoutComponent: React.FC<SmartLayoutComponentProps> = ({
    element,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    isFocused,
    onUpdateElement,
}) => {
    const elementVariant = element.elementVariant;

    const renderLayout = useCallback(() => {
        switch (elementVariant) {
            case 'images-with-text':
                return (
                    <ImagesWithTextComponent
                        element={element}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                        onUpdateElement={onUpdateElement}
                    />
                );
            case 'text-boxes':
                return (
                    <TextBoxesComponent
                        element={element}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                        onUpdateElement={onUpdateElement}
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
                    <ImagesWithTextComponent
                        element={element}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                        onUpdateElement={onUpdateElement}
                    />
                );
        }
    }, [element, elementVariant, isFocused, layoutId, onUpdateElement, presentationId, slideId, tiptapRefs]);

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

export default SmartLayoutComponent;

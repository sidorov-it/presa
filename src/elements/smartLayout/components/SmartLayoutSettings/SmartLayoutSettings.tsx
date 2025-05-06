import React, { MutableRefObject } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import ImageWithTextSettings from './ImageWithTextSettings/ImageWithTextSettings';
import TextBoxesSettings from './TextBoxesSettings/TextBoxesSettings';

interface SmartLayoutSettingsProps {
    slideId: string;
    layoutId: string;
    elementId: string;
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const SmartLayoutSettings: React.FC<SmartLayoutSettingsProps> = ({
    slideId,
    layoutId,
    elementId,
    presentationId,
    tiptapRefs,
}) => {
    const element = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement
    );

    if (element.elementVariant === 'images-with-text') {
        return (
            <ImageWithTextSettings
                element={element}
                slideId={slideId}
                layoutId={layoutId}
                elementId={elementId}
                presentationId={presentationId}
                tiptapRefs={tiptapRefs}
            />
        );
    } else if (element.elementVariant === 'text-boxes') {
        return (
            <TextBoxesSettings
                element={element}
                slideId={slideId}
                layoutId={layoutId}
                elementId={elementId}
                presentationId={presentationId}
                tiptapRefs={tiptapRefs}
            />
        );
    }

    return null;
};

export default SmartLayoutSettings;

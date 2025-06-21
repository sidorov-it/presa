import { RefObject } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import TextBoxesComponent from './TextBoxesComponent';

interface TextBoxesProps {
    elementId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
}

export default function TextBoxes({
    elementId,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
}: TextBoxesProps) {
    const element = usePresentationStore(state =>
        state.getElement(presentationId, slideId, layoutId, elementId)
    ) as SmartLayoutElement;
    const updateElement = usePresentationStore(state => state.updateElement);

    return (
        <TextBoxesComponent
            element={element}
            tiptapRefs={tiptapRefs}
            presentationId={presentationId}
            slideId={slideId}
            layoutId={layoutId}
            isFocused={isFocused}
            onUpdateElement={data =>
                updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data,
                })
            }
        />
    );
}
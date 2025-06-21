import { RefObject } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import ImagesWithTextComponent from './ImagesWithTextComponent';

interface ImagesWithTextProps {
    elementId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
}

export default function ImagesWithText({
    elementId,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
}: ImagesWithTextProps) {
    const element = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId)
    ) as SmartLayoutElement;
    const updateElement = usePresentationStore(state => state.updateElement);

    return (
        <ImagesWithTextComponent
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

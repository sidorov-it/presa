import { RefObject } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import SmartLayoutComponent from './SmartLayoutComponent';

interface SmartLayoutProps {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    isFocused: boolean;
}

export default function SmartLayout({
    elementId,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    isFocused,
}: SmartLayoutProps) {
    const element = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId)
    ) as SmartLayoutElement;
    const updateElement = usePresentationStore(state => state.updateElement);

    return (
        <SmartLayoutComponent
            element={element}
            presentationId={presentationId}
            slideId={slideId}
            layoutId={layoutId}
            tiptapRefs={tiptapRefs}
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

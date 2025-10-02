/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { RefObject } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import { useShallow } from 'zustand/react/shallow';
import TimelineVertical from './TimelineVertical';
import TimelineHorizontal from './TimelineHorizontal';

export default function Timeline({
    elementId,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isFocused,
}: {
    elementId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isFocused: boolean;
}) {
    // Get direction first to determine which component to use
    const direction = usePresentationStore(
        useShallow(state => {
            const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement & {
                direction?: 'horizontal' | 'vertical';
            };
            return element.direction || 'horizontal';
        })
    );

    // Use dedicated vertical component for vertical direction
    if (direction === 'vertical') {
        return (
            <TimelineVertical
                elementId={elementId}
                tiptapRefs={tiptapRefs}
                presentationId={presentationId}
                slideId={slideId}
                layoutId={layoutId}
                isFocused={isFocused}
            />
        );
    }

    // Horizontal timeline implementation
    return (
        <TimelineHorizontal
            elementId={elementId}
            tiptapRefs={tiptapRefs}
            presentationId={presentationId}
            slideId={slideId}
            layoutId={layoutId}
            isFocused={isFocused}
        />
    );
}

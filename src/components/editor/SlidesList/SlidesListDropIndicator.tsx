import React from 'react';
import { useSlideDndStore } from '@/store/slideDndStore';

const SlidesListDropIndicator = () => {
    const dragState = useSlideDndStore(state => state.dragState);
    const indicators = useSlideDndStore(state => state.indicators);
    const sourceSlideId = useSlideDndStore(state => state.sourceSlideId);

    if (dragState !== 'dragging' || !indicators.slideIndicator || !indicators.slidePosition) {
        return null;
    }

    // Look for slide element specifically within the slides list context
    const slidesListPanel = document.querySelector('.slides-list-panel');
    if (!slidesListPanel) return null;

    const slide = slidesListPanel.querySelector<HTMLElement>(`[data-slide-id="${indicators.slideIndicator}"]`);

    if (!slide) return null;

    // Make sure we're actually dragging slides and not other elements
    if (!sourceSlideId) return null;

    const rect = slide.getBoundingClientRect();
    const thickness = 4;
    const style: React.CSSProperties = {
        position: 'fixed',
        left: rect.left,
        top: indicators.slidePosition === 'top' ? rect.top - thickness / 2 : rect.bottom - thickness / 2,
        width: rect.width,
        height: thickness,
        pointerEvents: 'none',
        backgroundColor: '#6C63FF',
        boxShadow: '0 0 6px rgba(108,99,255,0.6)',
        borderRadius: '2px',
        zIndex: 10000,
    };

    return <div className="slides-list-drop-indicator" style={style} />;
};

export default SlidesListDropIndicator;

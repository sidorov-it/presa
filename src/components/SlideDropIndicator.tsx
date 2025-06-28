import Portal from './Portal';
import { useSlideDndStore } from '@/store/slideDndStore';

const SlideDropIndicator = () => {
    const dragState = useSlideDndStore(state => state.dragState);
    const indicators = useSlideDndStore(state => state.indicators);

    if (
        dragState !== 'dragging' ||
        !indicators.slideIndicator ||
        !indicators.slidePosition
    ) {
        return null;
    }

    const slide = document.querySelector<HTMLElement>(
        `[data-slide-id="${indicators.slideIndicator}"]`
    );
    if (!slide) return null;

    const rect = slide.getBoundingClientRect();
    const thickness = 6;
    const style: React.CSSProperties = {
        position: 'fixed',
        left: rect.left,
        top:
            indicators.slidePosition === 'top'
                ? rect.top - thickness / 2
                : rect.bottom - thickness / 2,
        width: rect.width,
        height: thickness,
        pointerEvents: 'none',
        backgroundColor: '#6C63FF',
        boxShadow: '0 0 6px rgba(59,130,246,0.6)',
        borderRadius: '3px',
        zIndex: 10000,
    };

    return (
        <Portal>
            <div className="slide-drop-indicator" style={style} />
        </Portal>
    );
};

export default SlideDropIndicator;

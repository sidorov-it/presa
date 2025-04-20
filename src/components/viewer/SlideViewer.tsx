import { Slide } from '@/types';
import LayoutViewer from './LayoutViewer';

interface SlideViewerProps {
    slide: Slide;
}

const SlideViewer = ({ slide }: SlideViewerProps) => {
    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: '72rem',
                height: '100%',
                transitionProperty: 'all',
                transitionTimingFunction: ['cubic-bezier(0.4, 0, 0.2, 1)', 'cubic-bezier(0.4, 0, 0.2, 1)'],
                transitionDuration: ['300ms', '300ms'],
            }}
        >
            <div
                style={{
                    top: '0',
                    right: '0',
                    bottom: '0',
                    left: '0',
                    padding: '2rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                }}
            >
                {slide.layouts.map(layout => (
                    <LayoutViewer key={layout.id} layout={layout} slideId={slide.id} />
                ))}
            </div>
        </div>
    );
};

export default SlideViewer;

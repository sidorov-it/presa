import { Slide } from '@/types';
import LayoutViewer from './LayoutViewer';

interface SlideViewerProps {
    slide: Slide;
}

const SlideViewer = ({ slide }: SlideViewerProps) => {
    return (
        <div className="w-full h-full max-w-6xl relative mx-auto transition-all duration-300 ease-in-out themed-slide">
            <div className="inset-0 p-8 rounded-lg shadow-lg themed-card">
                {slide.layouts.map(layout => (
                    <LayoutViewer
                        key={layout.id}
                        layout={layout}
                        slideId={slide.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default SlideViewer;
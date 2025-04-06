import React from 'react';
import { IPresentation } from '@/types';
import SlideViewer from './SlideViewer';

interface PresentationViewerProps {
    presentation: IPresentation;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({
    presentation
}) => {
    return (
        <div className="min-h-screen w-full overflow-y-auto py-10 px-4">
            <div className="max-w-6xl mx-auto space-y-20">
                {presentation.slides.map((slide, index) => (
                    <div key={slide.id} id={`slide-${index + 1}`} className="scroll-mt-10">
                        <SlideViewer slide={slide} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PresentationViewer;
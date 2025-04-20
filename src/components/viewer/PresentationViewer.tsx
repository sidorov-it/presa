import React from 'react';
import { IPresentation } from '@/types';
import SlideViewer from './SlideViewer';

interface PresentationViewerProps {
    presentation: IPresentation;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({ presentation }) => {
    return (
        <div
            style={{
                overflowY: 'auto',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                paddingTop: '2.5rem',
                paddingBottom: '2.5rem',
                width: '100%',
                minHeight: '100vh',
            }}
        >
            <div style={{ marginTop: '5rem', maxWidth: '72rem' }}>
                {presentation.slides.map((slide, index) => (
                    <div key={slide.id} id={`slide-${index + 1}`} style={{ scrollMarginTop: '2.5rem' }}>
                        <SlideViewer slide={slide} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PresentationViewer;

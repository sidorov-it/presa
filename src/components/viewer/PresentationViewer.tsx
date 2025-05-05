import React, { useState } from 'react';
import { IPresentation } from '@/types';
import SlideViewer from './SlideViewer';

interface PresentationViewerProps {
    presentation: IPresentation;
    initialSlideIndex?: number;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({ presentation, initialSlideIndex = 0 }) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);

    // Handle navigation between slides
    const handleNextSlide = () => {
        if (currentSlideIndex < presentation.slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    const handlePreviousSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            handleNextSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            handlePreviousSlide();
        }
    };

    // Current slide
    const currentSlide = presentation.slides[currentSlideIndex];

    if (!currentSlide) {
        return <div>No slides to display</div>;
    }

    return (
        <div
            className="presentation-viewer"
            onKeyDown={handleKeyDown}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div style={{ flex: 1, width: '100%', position: 'relative' }}>
                <SlideViewer slide={currentSlide} presentationId={presentation.id} />
            </div>

            {/* Navigation controls */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginTop: '1rem',
                }}
            >
                <button
                    onClick={handlePreviousSlide}
                    disabled={currentSlideIndex === 0}
                    aria-label="Previous slide"
                    className="slide-nav-button"
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        background: '#f0f0f0',
                        border: '1px solid #ccc',
                        cursor: 'pointer',
                        opacity: currentSlideIndex === 0 ? 0.5 : 1,
                    }}
                >
                    Previous
                </button>

                <div style={{ margin: '0 1rem' }}>
                    {currentSlideIndex + 1} / {presentation.slides.length}
                </div>

                <button
                    onClick={handleNextSlide}
                    disabled={currentSlideIndex === presentation.slides.length - 1}
                    aria-label="Next slide"
                    className="slide-nav-button"
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        background: '#f0f0f0',
                        border: '1px solid #ccc',
                        cursor: 'pointer',
                        opacity: currentSlideIndex === presentation.slides.length - 1 ? 0.5 : 1,
                    }}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default PresentationViewer;

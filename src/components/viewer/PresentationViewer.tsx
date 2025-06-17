import React from 'react';
import { Slide } from '@/types';
import SlideViewer from './SlideViewer/SlideViewer';
import styles from './PresentationViewer.module.css';

interface PresentationViewerProps {
    slides: Slide[];
    showImagePlaceholder?: boolean;
    isPreview?: boolean;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({
    slides,
    showImagePlaceholder = false,
    isPreview = false,
}) => {
    if (!slides || slides.length === 0) {
        return <div>No slides to display</div>;
    }

    return (
        <div className={styles.viewerContainer}>
            <div className={styles.allSlidesContainer}>
                {slides.map((slide: Slide, index: number) => (
                    <div key={slide.id} id={`slide-${index + 1}`} className={styles.slideWrapper}>
                        <SlideViewer slide={slide} showImagePlaceholder={showImagePlaceholder} isPreview={isPreview} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PresentationViewer;

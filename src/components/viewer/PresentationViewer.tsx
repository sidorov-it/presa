import React from 'react';
import { IPresentation, Slide } from '@/types';
import SlideViewer from './SlideViewer/SlideViewer';
import styles from './PresentationViewer.module.css';

interface PresentationViewerProps {
    presentation: IPresentation;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({ presentation }) => {
    if (!presentation.slides || presentation.slides.length === 0) {
        return <div>No slides to display</div>;
    }

    return (
        <div className={styles.viewerContainer}>
            <div className={styles.allSlidesContainer}>
                {presentation.slides.map((slide: Slide, index: number) => (
                    <div key={slide.id} id={`slide-${index + 1}`} className={styles.slideWrapper}>
                        <SlideViewer slide={slide} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PresentationViewer;

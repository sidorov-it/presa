import React from 'react';
import { Slide, GlobalHeaderFooterConfig } from '@/types';
import SlideViewer from '../SlideViewer/SlideViewer';
import styles from './PresentationViewer.module.css';
import { Theme } from '@/types/theme';
interface PresentationViewerProps {
    slides: Slide[];
    showImagePlaceholder?: boolean;
    isPreview?: boolean;
    primaryAccentColor: string;
    theme: Theme;
    globalHeaderFooterConfig?: GlobalHeaderFooterConfig;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({
    slides,
    showImagePlaceholder = false,
    isPreview = false,
    primaryAccentColor,
    theme,
    globalHeaderFooterConfig,
}) => {
    const visibleSlides = slides.filter(slide => !slide.hidden);

    if (!visibleSlides || visibleSlides.length === 0) {
        return <div>No slides to display</div>;
    }

    return (
        <div className={styles.presentationViewerContainer}>
            <div className={styles.presentationViewerAllSlidesContainer}>
                {visibleSlides.map((slide: Slide, index: number) => (
                    <div
                        key={slide.id}
                        id={`slide-${index + 1}`}
                        className={`${styles.presentationViewerSlideWrapper} presentationViewerSlideWrapper`}
                    >
                        <SlideViewer
                            theme={theme}
                            slide={slide}
                            showImagePlaceholder={showImagePlaceholder}
                            isPreview={isPreview}
                            primaryAccentColor={primaryAccentColor}
                            currentSlideIndex={index}
                            totalSlides={visibleSlides.length}
                            globalHeaderFooterConfig={globalHeaderFooterConfig}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PresentationViewer;

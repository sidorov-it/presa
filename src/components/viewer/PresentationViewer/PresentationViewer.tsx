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
    hasActiveSubscription?: boolean;
    isPdfExport?: boolean;
    hideBranding?: boolean;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({
    slides,
    showImagePlaceholder = false,
    isPreview = false,
    primaryAccentColor,
    theme,
    globalHeaderFooterConfig,
    hasActiveSubscription = true,
    isPdfExport = false,
    hideBranding = false,
}) => {
    const visibleSlides = slides.filter(slide => !slide.hidden);

    if (!visibleSlides || visibleSlides.length === 0) {
        return <div>No slides to display</div>;
    }

    const containerClassName = `${styles.presentationViewerContainer} ${isPdfExport ? styles.pdfExportContainer : ''}`;
    const allSlidesClassName = `${styles.presentationViewerAllSlidesContainer} ${isPdfExport ? styles.pdfExportAllSlidesContainer : ''}`;

    return (
        <div className={containerClassName} data-pdf-export={isPdfExport ? 'true' : undefined}>
            <div className={allSlidesClassName}>
                {visibleSlides.map((slide: Slide, index: number) => (
                    <div
                        key={slide.id}
                        id={`slide-${index + 1}`}
                        className={`${styles.presentationViewerSlideWrapper} ${isPdfExport ? styles.pdfExportSlideWrapper : ''} presentationViewerSlideWrapper`}
                        data-pdf-slide={isPdfExport ? String(index + 1) : undefined}
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
                            hasActiveSubscription={hasActiveSubscription}
                            isPdfExport={isPdfExport}
                            hideBranding={hideBranding}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PresentationViewer;

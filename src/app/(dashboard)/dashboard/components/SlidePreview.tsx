import React from 'react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import ScopedThemeStylesApplier from '@/components/viewer/theme/ScopedThemeStylesApplier/ScopedThemeStylesApplier';
import SlideViewer from '@/components/viewer/SlideViewer/SlideViewer';
import { getSlideLayoutVars } from '@/utils/themeUtils';
import styles from './SlidePreview.module.css';

interface SlidePreviewProps {
    presentation: IPresentation;
    theme: Theme;
}

export default function SlidePreview({ presentation, theme }: SlidePreviewProps) {
    const firstSlide = presentation.slides[0];
    if (!firstSlide || !firstSlide.layouts) {
        return <div className={styles.empty}>Нет слайдов</div>;
    }

    // Calculate CSS variables similar to how it's done in /view page
    const aspectRatio = 1.7777777777777777;

    // For preview, we need to calculate the scale based on container size
    // Container height is 10rem = 160px (assuming 16px base font)
    // We want the slide to scale down to fit the container width
    const containerWidthPx = 300; // Approximate width of preview container
    const standardSlideWidthPx = 1032; // Standard slide width from /view
    // const previewCardFontScale = containerWidthPx / standardSlideWidthPx; // ~0.29
    const previewCardFontScale = 0.27;

    // Use getSlideLayoutVars but override some values for preview
    const baseLayoutVars = getSlideLayoutVars({
        aspectRatio,
        cardFontScale: previewCardFontScale,
        renderMode: 'view',
    });

    // Override specific values for preview
    const previewLayoutVars = {
        ...baseLayoutVars,
        '--card-width': '100%',
        '--card-height': `calc(100% / ${aspectRatio})`,
        '--card-min-height': '10rem', // Match container height
        '--card-font-scale': `${previewCardFontScale}`,
        '--editor-width': '100%',
        '--card-max-width': '100%',
        '--card-max-height': '10rem',
        // Fix padding calculation for preview - should scale down, not up
        '--card-inner-padding-x': `calc(4em * ${previewCardFontScale})`,
        '--card-inner-padding-y': `calc(2.75em * ${previewCardFontScale})`,
        '--card-margin-height': `calc(2.75em * ${previewCardFontScale})`,
        '--card-inner-padding': `calc(2.75em * ${previewCardFontScale}) calc(4em * ${previewCardFontScale})`,
    };

    return (
        <div className={styles.wrapper} style={previewLayoutVars as React.CSSProperties}>
            <div className={styles.scaled}>
                <ScopedThemeStylesApplier theme={theme}>
                    <SlideViewer
                        theme={theme}
                        slide={firstSlide}
                        showImagePlaceholder={true}
                        primaryAccentColor={theme?.colors.primaryAccent || '#000000'}
                        isSlidePreview={true}
                    />
                </ScopedThemeStylesApplier>
            </div>
        </div>
    );
}

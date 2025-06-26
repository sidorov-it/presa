import React from 'react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import ScopedThemeStylesApplier from '@/components/viewer/theme/ScopedThemeStylesApplier/ScopedThemeStylesApplier';
import SlideViewer from '@/components/viewer/SlideViewer/SlideViewer';
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

    return (
        <div className={styles.wrapper}>
            <div className={styles.scaled}>
                <ScopedThemeStylesApplier theme={theme}>
                    <SlideViewer
                        theme={theme}
                        slide={firstSlide}
                        showImagePlaceholder={true}
                        primaryAccentColor={theme?.colors.primaryAccent || '#000000'}
                    />
                </ScopedThemeStylesApplier>
            </div>
        </div>
    );
}

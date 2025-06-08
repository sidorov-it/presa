import React from 'react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import ScopedThemeStylesApplier from '@/components/viewer/theme/ScopedThemeStylesApplier';
import SlideViewer from '@/components/viewer/SlideViewer';
import styles from './SlidePreview.module.css';

interface SlidePreviewProps {
    presentation: IPresentation;
    theme: Theme | null;
}

export default function SlidePreview({ presentation, theme }: SlidePreviewProps) {
    const firstSlide = presentation.slides[0];
    if (!firstSlide) {
        return (
            <div className={styles.empty}>Нет слайдов</div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.scaled}>
                <ScopedThemeStylesApplier theme={theme}>
                    <SlideViewer slide={firstSlide} />
                </ScopedThemeStylesApplier>
            </div>
        </div>
    );
}

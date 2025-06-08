import React from 'react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import ScopedThemeStylesApplier from '@/components/viewer/theme/ScopedThemeStylesApplier';
import SlideViewer from '@/components/viewer/SlideViewer';

interface PresentationPreviewProps {
    presentation: IPresentation;
    theme: Theme | null;
}

export default function PresentationPreview({ presentation, theme }: PresentationPreviewProps) {
    const firstSlide = presentation.slides[0];
    if (!firstSlide) {
        return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)' }}>Нет слайдов</div>;
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ transform: 'scale(0.28)', transformOrigin: 'top left' }}>
                <ScopedThemeStylesApplier theme={theme}>
                    <SlideViewer slide={firstSlide} />
                </ScopedThemeStylesApplier>
            </div>
        </div>
    );
}

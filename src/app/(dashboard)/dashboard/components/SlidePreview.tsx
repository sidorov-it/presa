import React, { useRef, useEffect, useState } from 'react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import ScopedThemeStylesApplier from '@/components/viewer/theme/ScopedThemeStylesApplier/ScopedThemeStylesApplier';
import SlideViewer from '@/components/viewer/SlideViewer/SlideViewer';
import { getSlideLayoutVars } from '@/utils/themeUtils';
import styles from './SlidePreview.module.css';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

interface SlidePreviewProps {
    presentation: IPresentation;
    theme: Theme;
}

export default function SlidePreview({ presentation, theme }: SlidePreviewProps) {
    const firstSlide = presentation.slides[0];
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

    const { hasActiveSubscription } = useSubscriptionCheck();

    // Измеряем размеры контейнера
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerDimensions({
                    width: rect.width,
                    height: rect.height,
                });
            }
        };

        updateDimensions();

        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    const aspectRatio = 1.7777777777777777;

    // Используем новые параметры для контекстного масштабирования
    const layoutVars = getSlideLayoutVars({
        aspectRatio,
        cardFontScale: 1,
        renderMode: 'view',
        containerWidth: containerDimensions.width,
        containerHeight: containerDimensions.height,
        useContainerScaling: true,
    });

    if (!firstSlide || !firstSlide.layouts) {
        return <div className={styles.empty}>Нет слайдов</div>;
    }

    return (
        <div ref={containerRef} className={styles.wrapper} style={layoutVars as React.CSSProperties}>
            <div className={styles.scaled}>
                <ScopedThemeStylesApplier theme={theme}>
                    <SlideViewer
                        theme={theme}
                        slide={firstSlide}
                        showImagePlaceholder={true}
                        primaryAccentColor={theme?.colors.primaryAccent || '#000000'}
                        isSlidePreview={true}
                        hasActiveSubscription={hasActiveSubscription}
                    />
                </ScopedThemeStylesApplier>
            </div>
        </div>
    );
}

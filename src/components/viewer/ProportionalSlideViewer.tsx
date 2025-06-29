import React, { useRef, useMemo } from 'react';
import { Slide } from '@/types';
import SlideViewer from './SlideViewer/SlideViewer';
import { DEFAULT_ASPECT_RATIO, calculateSlideAspectRatioWithContent } from '@/utils/slideImageProportions';
import { Theme } from '@/types/theme';

interface ProportionalSlideViewerProps {
    slide: Slide;
    themeClassName?: string;
    presentationId?: string;
    isPdfExport?: boolean;
    fullPage?: boolean;
    showImagePlaceholder?: boolean;
    isPreview?: boolean;
    primaryAccentColor: string;
    wrapperRef?: React.Ref<HTMLDivElement>;
    theme: Theme;
}

/**
 * Компонент для отображения слайда с учетом его пропорций
 * Обертывает стандартный SlideViewer и добавляет поддержку соотношения сторон
 */
const ProportionalSlideViewer: React.FC<ProportionalSlideViewerProps> = props => {
    const { slide } = props;
    const containerRef = useRef<HTMLDivElement>(null);

    // Получаем соотношение сторон слайда с учетом контента и изображения
    const aspectRatio = useMemo(() => {
        // Если у слайда есть собственное соотношение сторон, используем его
        if (slide.aspectRatio) {
            return slide.aspectRatio;
        }

        // Если это шаблон с изображением сверху и у изображения есть высота
        if (slide.templateType === 'imageTop' && slide.imageSize?.height) {
            // Получаем высоту изображения в процентах
            const imageHeightPercent = slide.imageSize.height;
            
            // Оцениваем высоту контента (в реальном приложении это должно быть измерено)
            // Здесь мы используем приблизительное значение, основанное на количестве layouts
            const estimatedContentHeight = slide.layouts.length * 50; // 50px на каждый layout
            
            // Рассчитываем соотношение сторон с учетом изображения и контента
            return calculateSlideAspectRatioWithContent(
                imageHeightPercent,
                estimatedContentHeight,
                1000 // Условная ширина для расчетов
            );
        }
        
        // По умолчанию используем стандартное соотношение сторон 16:9
        return slide.baseAspectRatio || DEFAULT_ASPECT_RATIO;
    }, [slide]);

    // Стили для контейнера с учетом пропорций
    const containerStyle = useMemo(() => {
        return {
            width: '100%',
            height: 'auto',
            aspectRatio: aspectRatio ? `${aspectRatio}` : '16/9',
            position: 'relative' as const,
            overflow: 'hidden',
        };
    }, [aspectRatio]);

    return (
        <div ref={containerRef} style={containerStyle} className="proportional-slide-container">
            <SlideViewer {...props} />
        </div>
    );
};

export default ProportionalSlideViewer;

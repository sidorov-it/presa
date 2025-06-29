import React, { useEffect, useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { calculateBaseHeight, calculateMaxImageHeight, constrainImageHeight } from '@/utils/slideImageProportions';

interface SlideContentMeasurerProps {
    presentationId: string;
    slideId: string;
    templateType: string;
}

/**
 * Компонент для измерения высоты контента слайда и адаптации высоты изображения
 * Автоматически измеряет высоту контента и обновляет максимальную высоту изображения
 */
const SlideContentMeasurer: React.FC<SlideContentMeasurerProps> = ({
    presentationId,
    slideId,
    templateType,
}) => {
    const slide = usePresentationStore(state => state.getSlide(presentationId, slideId));
    const updateSlide = usePresentationStore(state => state.updateSlide);
    const contentRef = useRef<HTMLDivElement>(null);
    const slideRef = useRef<HTMLDivElement>(null);

    // Измеряем высоту контента и обновляем максимальную высоту изображения
    useEffect(() => {
        // Только для шаблона с изображением сверху
        if (templateType !== 'imageTop') return;

        const measureContent = () => {
            if (!contentRef.current || !slideRef.current) return;

            const slideRect = slideRef.current.getBoundingClientRect();
            const contentHeight = contentRef.current.offsetHeight;
            const baseHeight = calculateBaseHeight(slideRect.width);

            // Рассчитываем максимально допустимую высоту изображения
            const maxHeightPercent = calculateMaxImageHeight(contentHeight, baseHeight);

            // Если у слайда уже есть размер изображения, проверяем, не превышает ли он максимальный
            if (slide?.imageSize?.height) {
                const currentHeightPercent = parseFloat(slide.imageSize.height);
                
                // Если текущая высота превышает максимальную, обновляем её
                if (currentHeightPercent > maxHeightPercent) {
                    updateSlide(
                        presentationId,
                        slideId,
                        {
                            imageSize: {
                                ...slide.imageSize,
                                height: constrainImageHeight(currentHeightPercent, maxHeightPercent),
                            },
                        },
                        false // не записывать в историю, это автоматическое обновление
                    );
                }
            }
        };

        // Измеряем контент при монтировании и изменении размера окна
        measureContent();
        window.addEventListener('resize', measureContent);
        
        // Создаем MutationObserver для отслеживания изменений в контенте
        const observer = new MutationObserver(measureContent);
        
        if (contentRef.current) {
            observer.observe(contentRef.current, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
            });
        }

        return () => {
            window.removeEventListener('resize', measureContent);
            observer.disconnect();
        };
    }, [presentationId, slideId, templateType, slide?.imageSize, updateSlide]);

    return null; // Компонент не рендерит никакой UI
};

export default SlideContentMeasurer; 
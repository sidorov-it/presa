import { Slide, GlobalHeaderFooterConfig } from '@/types';

export const shouldApplyHeaderFooter = (
    slideIndex: number,
    totalSlides: number,
    config: GlobalHeaderFooterConfig
): boolean => {
    switch (config.applyTo) {
        case 'all':
            return true;
        case 'except-first':
            return slideIndex > 0;
        case 'except-first-last':
            return slideIndex > 0 && slideIndex < totalSlides - 1;
        default:
            return false;
    }
};

export const applyGlobalHeaderFooterToSlide = (
    slide: Slide,
    slideIndex: number,
    totalSlides: number,
    globalConfig: GlobalHeaderFooterConfig
): Slide => {
    const shouldApply = shouldApplyHeaderFooter(slideIndex, totalSlides, globalConfig);

    if (!shouldApply) {
        // Remove any existing header/footer from this slide
        const { header, footer, ...slideWithoutHeaderFooter } = slide;
        return slideWithoutHeaderFooter;
    }

    // Если у слайда есть собственные настройки заголовка/подвала, используем их
    // Иначе применяем глобальные настройки
    return {
        ...slide,
        header: slide.header || (globalConfig.header.enabled ? globalConfig.header : undefined),
        footer: slide.footer || (globalConfig.footer.enabled ? globalConfig.footer : undefined),
    };
};

export const applyGlobalHeaderFooterToSlides = (slides: Slide[], globalConfig: GlobalHeaderFooterConfig): Slide[] => {
    return slides.map((slide, index) => applyGlobalHeaderFooterToSlide(slide, index, slides.length, globalConfig));
};

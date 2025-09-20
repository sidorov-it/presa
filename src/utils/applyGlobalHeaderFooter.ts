import { Slide, GlobalHeaderFooterConfig, SlideHeaderFooterConfig, HeaderFooterConfig } from '@/types';

export const shouldApplyHeaderFooter = (
    slideIndex: number,
    totalSlides: number,
    config: GlobalHeaderFooterConfig,
    targetSlideIndex?: number
): boolean => {
    switch (config.applyTo) {
        case 'all':
            return true;
        case 'except-first':
            return slideIndex > 0;
        case 'except-first-last':
            return slideIndex > 0 && slideIndex < totalSlides - 1;
        case 'current-slide':
            return targetSlideIndex !== undefined && slideIndex === targetSlideIndex;
        default:
            return false;
    }
};

const resolveSlideHeaderFooter = (
    slideConfig: SlideHeaderFooterConfig | undefined,
    globalConfig: HeaderFooterConfig,
    shouldApplyGlobal: boolean
): SlideHeaderFooterConfig | undefined => {
    // If slide has explicit configuration with overrideGlobal flag
    if (slideConfig && slideConfig.overrideGlobal !== undefined) {
        if (slideConfig.overrideGlobal === false) {
            // Explicitly disabled for this slide
            return undefined;
        }
        // Custom configuration for this slide
        return slideConfig;
    }

    // If no slide-specific config and global should apply
    if (!slideConfig && shouldApplyGlobal && globalConfig.enabled) {
        return globalConfig;
    }

    // Use slide config if it exists, otherwise undefined
    return slideConfig;
};

export const applyGlobalHeaderFooterToSlide = (
    slide: Slide,
    slideIndex: number,
    totalSlides: number,
    globalConfig: GlobalHeaderFooterConfig,
    targetSlideIndex?: number
): Slide => {
    const shouldApply = shouldApplyHeaderFooter(slideIndex, totalSlides, globalConfig, targetSlideIndex);

    // Resolve header and footer configurations
    const resolvedHeader = resolveSlideHeaderFooter(slide.header, globalConfig.header, shouldApply);
    const resolvedFooter = resolveSlideHeaderFooter(slide.footer, globalConfig.footer, shouldApply);

    return {
        ...slide,
        header: resolvedHeader,
        footer: resolvedFooter,
    };
};

export const applyGlobalHeaderFooterToSlides = (
    slides: Slide[],
    globalConfig: GlobalHeaderFooterConfig,
    targetSlideIndex?: number
): Slide[] => {
    return slides.map((slide, index) =>
        applyGlobalHeaderFooterToSlide(slide, index, slides.length, globalConfig, targetSlideIndex)
    );
};

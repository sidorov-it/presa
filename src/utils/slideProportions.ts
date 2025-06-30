/**
 * Утилиты для работы с пропорциями слайдов
 */

import { Slide } from '@/types';

// Базовые пропорции 16:9
export const DEFAULT_ASPECT_RATIO = 16 / 9;

/**
 * Получить текущие пропорции слайда
 */
export const getSlideAspectRatio = (slide: Slide): number => {
    return slide.aspectRatio || slide.baseAspectRatio || DEFAULT_ASPECT_RATIO;
};

/**
 * Получить базовые пропорции слайда
 */
export const getBaseAspectRatio = (slide: Slide): number => {
    return slide.baseAspectRatio || DEFAULT_ASPECT_RATIO;
};

/**
 * Рассчитать новые пропорции слайда на основе его размеров
 */
export const calculateSlideAspectRatio = (slideElement: HTMLElement): number => {
    const rect = slideElement.getBoundingClientRect();
    return rect.width / rect.height;
};

/**
 * Конвертировать размер изображения в пропорцию относительно слайда
 */
export const convertImageSizeToRatio = (
    imageSize: { width?: string; height?: string },
    slideElement: HTMLElement,
    templateType: string
): { widthRatio?: number; heightRatio?: number } => {
    const result: { widthRatio?: number; heightRatio?: number } = {};
    const slideRect = slideElement.getBoundingClientRect();

    if (templateType === 'imageTop' && imageSize.height) {
        // Для изображения сверху конвертируем пиксели/проценты в пропорцию от высоты слайда
        let heightInPixels: number;

        if (imageSize.height.endsWith('%')) {
            const heightPercent = parseFloat(imageSize.height);
            heightInPixels = (heightPercent / 100) * slideRect.height;
        } else {
            heightInPixels = parseFloat(imageSize.height);
        }

        result.heightRatio = heightInPixels / slideRect.height;
    } else if ((templateType === 'imageLeft' || templateType === 'imageRight') && imageSize.width) {
        // Для изображения слева/справа конвертируем пиксели/проценты в пропорцию от ширины слайда
        let widthInPixels: number;

        if (imageSize.width.endsWith('%')) {
            const widthPercent = parseFloat(imageSize.width);
            widthInPixels = (widthPercent / 100) * slideRect.width;
        } else {
            widthInPixels = parseFloat(imageSize.width);
        }

        result.widthRatio = widthInPixels / slideRect.width;
    }

    return result;
};

/**
 * Применить пропорцию изображения к текущим размерам слайда
 */
export const applyImageSizeFromRatio = (
    imageRatio: { widthRatio?: number; heightRatio?: number },
    slideElement: HTMLElement,
    templateType: string
): { width?: string; height?: string } => {
    const result: { width?: string; height?: string } = {};
    const slideRect = slideElement.getBoundingClientRect();

    if (templateType === 'imageTop' && imageRatio.heightRatio) {
        // Для изображения сверху применяем пропорцию высоты
        const heightInPixels = imageRatio.heightRatio * slideRect.height;
        result.height = `${heightInPixels}px`;
    } else if ((templateType === 'imageLeft' || templateType === 'imageRight') && imageRatio.widthRatio) {
        // Для изображения слева/справа применяем пропорцию ширины
        const widthInPixels = imageRatio.widthRatio * slideRect.width;
        result.width = `${widthInPixels}px`;
    }

    return result;
};

/**
 * Обновить пропорции слайда
 */
export const updateSlideAspectRatio = (slide: Slide, newAspectRatio: number): Partial<Slide> => {
    return {
        aspectRatio: newAspectRatio,
        baseAspectRatio: slide.baseAspectRatio || DEFAULT_ASPECT_RATIO,
    };
};

/**
 * Получить размеры изображения по умолчанию для шаблона
 */
export const getDefaultImageSize = (templateType: string): { width?: string; height?: string } => {
    switch (templateType) {
        case 'imageTop':
            return { height: '33%' };
        case 'imageLeft':
        case 'imageRight':
            return { width: '33%' };
        default:
            return {};
    }
};

/**
 * Получить пропорции изображения по умолчанию для шаблона
 */
export const getDefaultImageRatio = (templateType: string): { widthRatio?: number; heightRatio?: number } => {
    switch (templateType) {
        case 'imageTop':
            return { heightRatio: 0.33 }; // 33% от высоты слайда
        case 'imageLeft':
        case 'imageRight':
            return { widthRatio: 0.33 }; // 33% от ширины слайда
        default:
            return {};
    }
};

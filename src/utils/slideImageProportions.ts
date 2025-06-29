/**
 * Утилиты для работы с пропорциями изображений в слайдах
 */

import { Slide } from '@/types';

// Базовые пропорции 16:9
export const DEFAULT_ASPECT_RATIO = 16 / 9;

// Стандартные размеры слайда в конструкторе (пиксели)
export const STANDARD_SLIDE_WIDTH = 960; // px
export const STANDARD_SLIDE_HEIGHT = 540; // px (16:9 ratio)

// Константы для изображений
export const MIN_IMAGE_HEIGHT_PERCENT = 10; // Минимальная высота изображения (% от базовой высоты)
export const MAX_IMAGE_HEIGHT_PERCENT = 50; // Максимальная начальная высота изображения (% от базовой высоты)
export const MIN_MAX_IMAGE_HEIGHT_PERCENT = 33; // Минимальное значение для максимальной высоты изображения

/**
 * Рассчитать базовую высоту слайда на основе его ширины (соотношение 16:9)
 * @param width Ширина слайда в пикселях
 * @returns Базовая высота слайда в пикселях
 */
export function calculateBaseHeight(width: number): number {
    return width / 16 * 9;
}

/**
 * Рассчитать максимально допустимую высоту изображения с учетом контента
 * @param contentHeight Высота контента в пикселях
 * @param baseHeight Базовая высота слайда в пикселях
 * @returns Максимальная высота изображения в процентах от базовой высоты
 */
export function calculateMaxImageHeight(contentHeight: number, baseHeight: number): number {
    // Рассчитываем процент, который занимает контент
    const contentPercent = (contentHeight / baseHeight) * 100;
    
    // Максимальная высота изображения = оставшееся пространство, но не менее MIN_MAX_IMAGE_HEIGHT_PERCENT
    const maxHeightPercent = Math.max(100 - contentPercent, MIN_MAX_IMAGE_HEIGHT_PERCENT);
    
    // Ограничиваем максимальную высоту изображения
    return Math.min(maxHeightPercent, MAX_IMAGE_HEIGHT_PERCENT);
}

/**
 * Преобразовать процент высоты изображения в пиксели на основе базовой высоты слайда
 * @param heightPercent Высота изображения в процентах от базовой высоты
 * @param baseHeight Базовая высота слайда в пикселях
 * @returns Высота изображения в пикселях
 */
export function imageHeightPercentToPixels(heightPercent: string | number, baseHeight: number): number {
    const percent = typeof heightPercent === 'string' ? parseFloat(heightPercent) : heightPercent;
    return (percent / 100) * baseHeight;
}

/**
 * Преобразовать высоту изображения в пикселях в процент от базовой высоты слайда
 * @param heightPixels Высота изображения в пикселях
 * @param baseHeight Базовая высота слайда в пикселях
 * @returns Высота изображения в процентах от базовой высоты
 */
export function imageHeightPixelsToPercent(heightPixels: number, baseHeight: number): string {
    const percent = (heightPixels / baseHeight) * 100;
    return `${percent.toFixed(2)}%`;
}

/**
 * Получить высоту изображения по умолчанию для шаблона
 * @param templateType Тип шаблона слайда
 * @returns Высота изображения в процентах от базовой высоты
 */
export function getDefaultImageHeight(templateType: string): string {
    switch (templateType) {
        case 'imageTop':
            return `${MIN_MAX_IMAGE_HEIGHT_PERCENT}%`; // 33%
        default:
            return '0%';
    }
}

/**
 * Ограничить высоту изображения минимальным и максимальным значениями
 * @param heightPercent Высота изображения в процентах
 * @param maxHeightPercent Максимальная допустимая высота в процентах
 * @returns Ограниченная высота изображения в процентах
 */
export function constrainImageHeight(heightPercent: string | number, maxHeightPercent: number = MAX_IMAGE_HEIGHT_PERCENT): string {
    const percent = typeof heightPercent === 'string' ? parseFloat(heightPercent) : heightPercent;
    const constrainedPercent = Math.max(MIN_IMAGE_HEIGHT_PERCENT, Math.min(percent, maxHeightPercent));
    return `${constrainedPercent.toFixed(2)}%`;
}

/**
 * Рассчитать общую высоту слайда с учетом высоты изображения и контента
 * @param imageHeightPercent Высота изображения в процентах от базовой высоты
 * @param contentHeight Высота контента в пикселях
 * @param slideWidth Ширина слайда в пикселях
 * @returns Общая высота слайда в пикселях
 */
export function calculateTotalSlideHeight(imageHeightPercent: string | number, contentHeight: number, slideWidth: number): number {
    const baseHeight = calculateBaseHeight(slideWidth);
    const imageHeight = imageHeightPercentToPixels(imageHeightPercent, baseHeight);
    return imageHeight + contentHeight;
}

/**
 * Рассчитать соотношение сторон слайда с учетом высоты изображения и контента
 * @param imageHeightPercent Высота изображения в процентах от базовой высоты
 * @param contentHeight Высота контента в пикселях
 * @param slideWidth Ширина слайда в пикселях
 * @returns Соотношение сторон слайда (ширина / высота)
 */
export function calculateSlideAspectRatioWithContent(
    imageHeightPercent: string | number, 
    contentHeight: number, 
    slideWidth: number
): number {
    const totalHeight = calculateTotalSlideHeight(imageHeightPercent, contentHeight, slideWidth);
    return slideWidth / totalHeight;
}

/**
 * Рассчитать соотношение сторон слайда на основе его размеров
 */
export const calculateSlideAspectRatio = (slideElement: HTMLElement): number => {
    const rect = slideElement.getBoundingClientRect();
    return rect.width / rect.height;
};

/**
 * Обновить пропорции слайда
 */
export const updateSlideAspectRatio = (slide: any, newAspectRatio: number): any => {
    return {
        aspectRatio: newAspectRatio,
        baseAspectRatio: slide.baseAspectRatio || DEFAULT_ASPECT_RATIO,
    };
};

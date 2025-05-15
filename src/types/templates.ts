import { IconType } from 'react-icons';
import { SlideTemplateConfig } from '.';

// Базовые типы
export type ElementType = 'image' | 'text' | 'heading' | 'list';
export type LayoutType = 'image-text' | 'text-image' | 'two-columns-equal' | 'three-columns';
export type Position = 'left' | 'right' | 'center';

// Интерфейсы для ограничений
export interface BaseConstraints {
    maxLength?: number;
    minLength?: number;
    required?: boolean;
}

export interface ImageConstraints extends BaseConstraints {
    aspectRatio?: string;
    allowedFormats?: string[];
    maxSize?: number;
}

export interface TextConstraints extends BaseConstraints {
    allowHtml?: boolean;
    allowedTags?: string[];
}

// Описание элемента шаблона
export interface TemplateElement {
    type: ElementType;
    position: Position;
    props: {
        width?: string | number;
        height?: string | number;
        alignment?: 'left' | 'right' | 'center';
        [key: string]: any;
    };
    constraints?: BaseConstraints | ImageConstraints | TextConstraints;
    llmHints?: {
        purpose: string;
        contextRules?: string[];
        examples?: string[];
    };
}

// Основная структура шаблона
export interface SlideTemplateCore {
    id: string;
    name: string;
    layout: LayoutType;
    elements: TemplateElement[];

    // UI метаданные
    ui: {
        category: string;
        label: string;
        icon: IconType;
        description?: string;
    };

    // LLM метаданные
    llm: {
        description: string;
        purpose: string[];
        useCases: string[];
        contextRules?: string[];
    };
}

export interface MenuCategory {
    id: string;
    label: string;
    Icon?: IconType;
    subCategories?: MenuSubCategory[];
    elements?: MenuItem[];
    excludeFromTable?: boolean;
    isSlideTemplate?: boolean;
}

export interface MenuSubCategory {
    id: string;
    label: string;
    elements: MenuItem[];
    excludeFromTable?: boolean;
}

export interface MenuItem {
    elementTypeId: string;
    label: string;
    Icon?: IconType;
    defaultProps?: Record<string, any>;
    elementVariant?: string;
    isSlideTemplate?: boolean;
    templateConfig?: SlideTemplateConfig;
}

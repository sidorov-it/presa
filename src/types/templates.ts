import { IconType } from 'react-icons';
import { LayoutType, SlideTemplateConfig, TextType } from '.';
import { ElementType } from './elements';

// export type LayoutType = string;
// export type LayoutType = 'image-text' | 'text-image' | 'two-columns-equal' | 'three-columns';
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

// Описание элемента шаблона
export interface TemplateElement {
    elementTypeId: ElementType;
    elementVariant?: string;
    slot: string;
    row: number;
    column: number;
    props: {
        width?: string | number;
        height?: string | number;
        alignment?: 'left' | 'right' | 'center';
        items?: Record<string, string>[];
        itemsSchema?: Array<{
            key: string;
            type: ElementType;
            variant?: TextType;
            linkedContentFields?: Array<string>;
        }>;
        [key: string]: any;
    };
    llmHints?: {
        purpose: string;
        contextRules?: string[];
        examples?: string[];
        items?: Record<
            string,
            {
                type: 'string';
                description: string;
                contextRules?: string[];
            }
        >;
    };
}

// Основная структура шаблона
export interface SlideTemplateCore {
    id: string;
    name: string;
    disabled?: boolean;
    layouts: Array<{
        layout: LayoutType;
        columnsCount: number;
        rowsCount: number;
        elements: TemplateElement[];
    }>;

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
    props?: Record<string, any>;
    elementVariant?: string;
    templateConfig?: SlideTemplateConfig;
}

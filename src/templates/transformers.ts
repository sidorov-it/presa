import { MenuItem } from '@/types/templates';
import { SlideTemplateCore } from '@/types/templates';
import { SlideTemplatesRegistry } from './SlideTemplatesRegistry';
import { LuLayoutDashboard } from 'react-icons/lu';

// Трансформеры для разных представлений
export class TemplateTransformers {
    // Для UI меню
    static toMenuRegistry(template: SlideTemplateCore): MenuItem {
        return {
            elementTypeId: 'slide-template',
            label: template.ui.label,
            Icon: template.ui.icon,
            elementVariant: template.id,
            templateConfig: {
                contentAlignment: template.contentAlignment || 'center',
                elementVariant: template.id,
                layouts: template.layouts.map(layout => ({
                    layout: layout.layout,
                    columnsCount: layout.columnsCount,
                    rowsCount: layout.rowsCount,
                    elements: layout.elements.map(elem => ({
                        elementTypeId: elem.elementTypeId,
                        elementVariant: elem.elementVariant,
                        props: elem.props,
                        row: elem.row,
                        column: elem.column,
                    })),
                })),
            },
        };
    }

    // Для LLM
    static toLLMTemplate(template: SlideTemplateCore) {
        return {
            id: template.id,
            name: template.name,
            description: template.llm.description,
            layouts: template.layouts.map(layout => ({
                layout: layout.layout,
                slots: layout.elements.map(elem => ({
                    type: elem.elementTypeId,
                    hints: elem.llmHints,
                })),
            })),
            purpose: template.llm.purpose,
            useCases: template.llm.useCases,
        };
    }
}

const templatesCategoriesName = {
    'image-text-templates': 'Изображения и текст',
    'column-templates': 'Колонки',
    'list-templates': 'Списки',
    'image-templates': 'Колонки с изображениями',
    'text-templates': 'Умные блоки',
    'chart-templates': 'Графики',
    'intro-templates': 'Вступление',
    'final-templates': 'Заключение',
};
// Построители меню и конфигураций
export class TemplateBuilders {
    // Построение структуры меню
    static buildMenuRegistry() {
        const templates = Object.values(SlideTemplatesRegistry);
        const categories = new Map<string, any>();

        templates.forEach(template => {
            if (!categories.has(template.ui.category)) {
                categories.set(template.ui.category, {
                    id: template.ui.category,
                    label: templatesCategoriesName[template.ui.category as keyof typeof templatesCategoriesName],
                    elements: [],
                });
            }

            const category = categories.get(template.ui.category);
            category.elements.push(TemplateTransformers.toMenuRegistry(template));
        });

        return {
            id: 'slide-templates',
            label: 'Шаблоны слайдов',
            Icon: LuLayoutDashboard,
            subCategories: Array.from(categories.values()),
        };
    }

    // Построение конфигурации для LLM
    static buildLLMConfig() {
        return Object.values(SlideTemplatesRegistry).map(template => TemplateTransformers.toLLMTemplate(template));
    }
}

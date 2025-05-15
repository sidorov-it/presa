import { MenuItem } from '@/types/templates';
import { SlideTemplateCore } from '@/types/templates';
import { SlideTemplatesRegistry } from './slideTemplates';
import { GrTemplate } from 'react-icons/gr';

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
                contentAlignment: 'center',
                layouts: [
                    {
                        layout: template.layout,
                        elements: template.elements.map(elem => ({
                            elementTypeId: elem.type,
                            defaultProps: elem.props,
                        })),
                    },
                ],
            },
        };
    }

    // Для LLM
    static toLLMTemplate(template: SlideTemplateCore) {
        return {
            id: template.id,
            name: template.name,
            description: template.llm.description,
            layout: template.layout,
            slots: template.elements.map(elem => ({
                type: elem.type,
                position: elem.position,
                constraints: elem.constraints,
                hints: elem.llmHints,
            })),
            purpose: template.llm.purpose,
            useCases: template.llm.useCases,
        };
    }
}

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
                    label: template.ui.label,
                    elements: [],
                });
            }

            const category = categories.get(template.ui.category);
            category.elements.push(TemplateTransformers.toMenuRegistry(template));
        });

        return {
            id: 'slide-templates',
            label: 'Шаблоны слайдов',
            Icon: GrTemplate,
            isSlideTemplate: true,
            subCategories: Array.from(categories.values()),
        };
    }

    // Построение конфигурации для LLM
    static buildLLMConfig() {
        return Object.values(SlideTemplatesRegistry).map(template => TemplateTransformers.toLLMTemplate(template));
    }
}

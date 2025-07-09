import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { createSlideFromTemplateWithContent } from '@/utils/createSlideFromTemplateWithContentMock';
import { createGenerateSlideContentFunction } from '@/services/llm/generateSlideContent';
import { generateId } from '@/utils/id';
import { ElementType } from '@/types/elements';
import { TextType } from '@/types';
import logger from '@/utils/logger';

// Placeholder content generators based on element type and context
const generatePlaceholderContent = (type: string, description?: string, purpose?: string): string => {
    const templates = {
        title: [
            'Заголовок презентации',
            'Основная тема слайда',
            'Ключевая идея',
            'Главная мысль',
            'Центральная концепция',
        ],
        heading: ['Важный раздел', 'Ключевая информация', 'Основные моменты', 'Главные аспекты', 'Центральные идеи'],
        content: [
            'Это пример содержимого для демонстрации структуры шаблона. Здесь может быть размещен любой текст, который поможет понять, как будет выглядеть готовый слайд.',
            'Демонстрационный контент показывает, как информация будет представлена в данном разделе слайда. Это помогает оценить визуальную структуру.',
            'Тестовое содержимое для проверки макета и расположения элементов. Позволяет увидеть финальный вид слайда перед добавлением реального контента.',
        ],
        description: [
            'Краткое описание или пояснение к основному контенту',
            'Дополнительная информация для лучшего понимания',
            'Поясняющий текст к представленным данным',
        ],
        image: [
            '/uploads/fbv8kc60ab1n7s95m3l5.jpg',
        ],
    };

    // Determine content type based on description and purpose
    let contentType = 'content';
    if (description || purpose) {
        const text = (description || purpose || '').toLowerCase();
        if (text.includes('заголовок') || text.includes('title') || text.includes('heading')) {
            contentType = 'heading';
        } else if (text.includes('изображение') || text.includes('image')) {
            contentType = 'image';
        } else if (text.includes('описание') || text.includes('description')) {
            contentType = 'description';
        }
    }

    if (type === ElementType.IMAGE) {
        contentType = 'image';
    }

    const options = templates[contentType] || templates.content;
    return options[Math.floor(Math.random() * options.length)];
};

// Generate placeholder list items
const generatePlaceholderList = (count: number = 3): string[] => {
    const items = [
        'Первый важный пункт для рассмотрения',
        'Второй ключевой элемент списка',
        'Третий значимый аспект темы',
        'Четвертая составляющая проблемы',
        'Пятый компонент решения',
        'Шестой фактор успеха',
    ];

    return items.slice(0, count);
};

// Generate placeholder smart layout items
const generatePlaceholderSmartLayoutItems = (itemsSchema: any[], count: number = 3) => {
    const result = {};

    for (let i = 0; i < count; i++) {
        itemsSchema.forEach(schemaItem => {
            const key = `${schemaItem.key}_${i}`;

            if (schemaItem.type === ElementType.TEXT) {
                if (schemaItem.variant === TextType.HEADING3) {
                    result[key] = `Заголовок ${i + 1}`;
                } else {
                    result[key] = generatePlaceholderContent('content', schemaItem.description);
                }
            } else if (schemaItem.type === ElementType.IMAGE) {
                result[key] = '/uploads/fbv8kc60ab1n7s95m3l5.jpg';
            } else {
                result[key] = generatePlaceholderContent('content', schemaItem.description);
            }
        });
    }

    return result;
};

// Generate placeholder chart data
const generatePlaceholderChartData = (chartType: string) => {
    const categories = ['Категория A', 'Категория B', 'Категория C', 'Категория D'];

    switch (chartType) {
        case 'bar':
        case 'line':
            return categories.map(name => ({
                name,
                value: Math.floor(Math.random() * 100) + 20,
            }));
        case 'pie':
        case 'donut':
            return categories.map(name => ({
                name,
                value: Math.floor(Math.random() * 30) + 10,
            }));
        default:
            return categories.map(name => ({
                name,
                value: Math.floor(Math.random() * 100) + 20,
            }));
    }
};

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { templateId } = await request.json();

        if (!templateId) {
            return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
        }

        const template = SlideTemplatesRegistry[templateId];
        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Generate function schema and slot mapping
        const { functionSchema, slotMapping } = createGenerateSlideContentFunction(template);

        // Generate placeholder content based on the schema
        const placeholderArgs = {};

        for (const [key, propertySchema] of Object.entries(functionSchema.parameters.properties)) {
            const slotInfo = slotMapping.get(key);

            if (propertySchema.type === 'object') {
                // Smart layout items
                if (slotInfo?.items) {
                    const itemsData = generatePlaceholderSmartLayoutItems(slotInfo.items, 3);
                    placeholderArgs[key] = itemsData;
                }
            } else if (propertySchema.type === 'array') {
                // List items
                placeholderArgs[key] = generatePlaceholderList(3);
            } else {
                // String content
                const description = propertySchema.description;
                const purpose = slotInfo?.llmHints?.purpose;

                // Special handling for chart data
                if (key.includes('chart') || purpose?.includes('диаграмм')) {
                    // For charts, we need structured data, not just text
                    const chartData = generatePlaceholderChartData('bar');
                    placeholderArgs[key] = JSON.stringify(chartData);
                } else {
                    placeholderArgs[key] = generatePlaceholderContent('content', description, purpose);
                }
            }
        }

        // Create slide from template with placeholder content
        const slide = await createSlideFromTemplateWithContent({
            templateId: template.id,
            slotMapping,
            layoutsContents: placeholderArgs,
            title: 'Тестовый слайд',
            options: {
                userId: session.user.id,
                requestId: generateId(),
            },
        });

        logger.info(`Template test completed for template ${templateId} by user ${session.user.id}`);

        return NextResponse.json({
            slide,
            template: {
                id: template.id,
                name: template.name,
                description: template.ui.description,
            },
            placeholderContent: placeholderArgs,
        });
    } catch (error) {
        logger.error('Template test error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate test slide',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

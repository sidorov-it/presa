import { NextRequest, NextResponse } from 'next/server';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { createSlideFromTemplateWithContent } from '@/utils/createSlideFromTemplateWithContent';
import { generateId } from '@/utils/id';
import { SlotKeyMapping } from '@/types/gigachat';

export async function POST(request: NextRequest) {
    try {
        const { jsonInput, selectedTemplate } = await request.json();

        if (!jsonInput || !selectedTemplate) {
            return NextResponse.json({ error: 'Пожалуйста, предоставьте JSON и выберите шаблон' }, { status: 400 });
        }

        // Парсим JSON из логов
        const functionArgs = JSON.parse(jsonInput);

        // Создаем slotMapping на основе шаблона
        const template = SlideTemplatesRegistry[selectedTemplate];
        if (!template) {
            return NextResponse.json({ error: `Шаблон ${selectedTemplate} не найден` }, { status: 404 });
        }

        // Создаем slotMapping для тестирования
        const slotMapping = new Map<string, SlotKeyMapping>();

        template.layouts.forEach((layout, layoutIndex) => {
            layout.elements.forEach((element, elementIndex) => {
                const uniqueKey = `${layoutIndex}_${elementIndex}_${element.slot}`;
                slotMapping.set(uniqueKey, {
                    uniqueKey,
                    layoutIndex,
                    elementIndex,
                    originalSlot: element.slot,
                    elementTypeId: element.elementTypeId,
                    textType: element.props?.textType,
                    llmHints: element.llmHints,
                    items: element.props?.itemsSchema?.map(item => ({
                        key: item.key,
                        originalKey: item.key,
                        type: item.type,
                        description: '',
                        contextRules: [],
                    })),
                    column: element.column,
                });
            });
        });

        // Создаем layoutsContents из functionArgs
        const layoutsContents: Record<string, string | string[]> = {};

        // Если functionArgs - это объект с ключами, используем их напрямую
        if (typeof functionArgs === 'object' && functionArgs !== null) {
            Object.entries(functionArgs).forEach(([key, value]) => {
                // Ищем соответствующий слот в slotMapping
                const matchingSlot = Array.from(slotMapping.entries()).find(
                    ([slotKey, mapping]) => mapping.originalSlot === key || slotKey.includes(key)
                );

                if (matchingSlot) {
                    layoutsContents[matchingSlot[0]] = value as string | string[];
                } else {
                    // Если точного соответствия нет, используем ключ как есть
                    layoutsContents[key] = value as string | string[];
                }
            });
        }

        // Создаем слайд
        const slide = await createSlideFromTemplateWithContent({
            templateId: selectedTemplate,
            slotMapping,
            layoutsContents,
            title: 'Тестовый слайд',
            options: {
                userId: 'test-user',
                requestId: generateId(),
            },
            withImages: false,
        });

        return NextResponse.json({ slide });
    } catch (error) {
        console.error('Error generating test slide:', error);
        return NextResponse.json(
            {
                error: `Ошибка при создании слайда: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            },
            { status: 500 }
        );
    }
}

import { createSlideFromTemplateWithContent } from '../createSlideFromTemplateWithContentMock';
import { SlotKeyMapping } from '@/types/gigachat';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';

jest.mock('@/services/llm/gigaChat', () => ({
    generateImage: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
}));

describe('createSlideFromTemplateWithContent', () => {
    test('slide inherits contentAlignment from template', async () => {
        // Test welcome-slide template which has contentAlignment: 'center'
        const templateId = 'welcome-slide';
        const template = SlideTemplatesRegistry[templateId];

        expect(template.contentAlignment).toBe('center');

        const slotMapping = new Map<string, SlotKeyMapping>();
        const layoutsContents = {};
        const title = 'Test Slide';

        const slide = await createSlideFromTemplateWithContent({
            templateId,
            slotMapping,
            layoutsContents,
            title,
            options: { userId: 'test-user', requestId: 'test-request' },
        });

        expect(slide.contentAlignment).toBe('center');
    });

    test('slide uses default center alignment when template has no contentAlignment', async () => {
        // Test a template without explicit contentAlignment
        const templateId = 'image-text';
        const template = SlideTemplatesRegistry[templateId];

        expect(template.contentAlignment).toBeUndefined();

        const slotMapping = new Map<string, SlotKeyMapping>();
        const layoutsContents = {};
        const title = 'Test Slide';

        const slide = await createSlideFromTemplateWithContent({
            templateId,
            slotMapping,
            layoutsContents,
            title,
            options: { userId: 'test-user', requestId: 'test-request' },
        });

        expect(slide.contentAlignment).toBe('center');
    });

    test('title-bullets template has top alignment', async () => {
        const templateId = 'title-bullets';
        const template = SlideTemplatesRegistry[templateId];

        expect(template.contentAlignment).toBe('top');

        const slotMapping = new Map<string, SlotKeyMapping>();
        const layoutsContents = {};
        const title = 'Test Slide';

        const slide = await createSlideFromTemplateWithContent({
            templateId,
            slotMapping,
            layoutsContents,
            title,
            options: { userId: 'test-user', requestId: 'test-request' },
        });

        expect(slide.contentAlignment).toBe('top');
    });

    test('true is true', async () => {
        const templateId = 'two-image-columns';
        const slotMapping = new Map([
            [
                'title',
                {
                    uniqueKey: 'title',
                    layoutIndex: 0,
                    elementIndex: 0,
                    column: 0,
                    originalSlot: 'title',
                    llmHints: {
                        purpose: 'Основной заголовок слайда',
                        contextRules: ['Четкий, информативный заголовок'],
                    },
                },
            ],
            [
                'image_left_column',
                {
                    uniqueKey: 'image_left_column',
                    layoutIndex: 1,
                    elementIndex: 0,
                    column: 0,
                    originalSlot: 'image_left_column',
                    llmHints: {
                        purpose: 'Иллюстрация описанной концепции',
                        contextRules: [
                            'Изображение должно визуально подкреплять текст слева',
                            'Выбирать изображения, усиливающие основные тезисы',
                        ],
                    },
                },
            ],
            [
                'title_left_column',
                {
                    uniqueKey: 'title_left_column',
                    layoutIndex: 1,
                    elementIndex: 1,
                    column: 0,
                    originalSlot: 'title_left_column',
                    llmHints: {
                        purpose: 'Заголовок левой колонки',
                        contextRules: ['Четкий, информативный заголовок'],
                    },
                },
            ],
            [
                'text_left_column',
                {
                    uniqueKey: 'text_left_column',
                    layoutIndex: 1,
                    elementIndex: 2,
                    column: 0,
                    originalSlot: 'text_left_column',
                    llmHints: {
                        purpose: 'Второй элемент из четырех',
                        contextRules: ['Краткость', 'Единый формат с другими колонками'],
                    },
                },
            ],
            [
                'image_right_column',
                {
                    uniqueKey: 'image_right_column',
                    layoutIndex: 1,
                    elementIndex: 3,
                    column: 1,
                    originalSlot: 'image_right_column',
                    llmHints: {
                        purpose: 'Иллюстрация описанной концепции',
                        contextRules: [
                            'Изображение должно визуально подкреплять текст слева',
                            'Выбирать изображения, усиливающие основные тезисы',
                        ],
                    },
                },
            ],
            [
                'title_right_column',
                {
                    uniqueKey: 'title_right_column',
                    layoutIndex: 1,
                    elementIndex: 4,
                    column: 1,
                    originalSlot: 'title_right_column',
                    llmHints: {
                        purpose: 'Заголовок левой колонки',
                        contextRules: ['Четкий, информативный заголовок'],
                    },
                },
            ],
            [
                'text_right_column',
                {
                    uniqueKey: 'text_right_column',
                    layoutIndex: 1,
                    elementIndex: 5,
                    column: 1,
                    originalSlot: 'text_right_column',
                    llmHints: {
                        purpose: 'Второй элемент из четырех',
                        contextRules: ['Краткость', 'Единый формат с другими колонками'],
                    },
                },
            ],
        ]);
        const layoutsContents = {
            image_left_column: 'изображение восхода солнца над городом, символизирующее новые горизонты и перспективы',
            image_right_column: 'график роста криптовалют, подчеркивающий их потенциал и развитие',
            text_left_column: 'Криптовалюты – будущее финансовой индустрии',
            text_right_column: 'Инвестиции в криптовалюты становятся все более привлекательными',
            title: 'Перспективы криптовалют',
            title_left_column: 'Финансовая революция',
            title_right_column: 'Инвестиционные возможности',
        };

        const title = 'Слайд о перспективах криптовалют';

        const slide = await createSlideFromTemplateWithContent(templateId, slotMapping, layoutsContents, title);

    });
});

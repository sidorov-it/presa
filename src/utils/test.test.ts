import {
    createGenerateSlideContentFunction,
    createPromptGenerateSlideContent,
} from '@/services/llm/generateSlideContent';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { createSlideFromTemplateWithContent } from './createSlideFromTemplateWithContent';
import { Slide } from '@/types';
import createRewriteSlideMapping from './createRewriteSlideMapping';

describe('Basic test', () => {
    test('true is true', async () => {
        // получаем шаблон слайда
        const template = SlideTemplatesRegistry['text-boxes-with-title'];
        // получаем функцию и слоты
        const { functionSchema, slotMapping } = createGenerateSlideContentFunction(template);

        // создаем промпт для генерации слайда
        const prompt = createPromptGenerateSlideContent('СТратегия компании', 1, 3, template, slotMapping);
        console.log(prompt);

        // получаем ответ от LLM
        const response = await gigaChatService.generate(prompt, {
            functions: [functionSchema],
            function_call: { name: 'generate_slide_text' },
        });
        // const response = {
        //     choices: [
        //         {
        //             message: {
        //                 content: '',
        //                 role: 'assistant',
        //                 function_call: {
        //                     name: 'generate_slide_text',
        //                     arguments: {
        //                         d2M0MmD4PR: {
        //                             AN7wt7UeSd: 'Целевая аудитория и миссия компании',
        //                             Gka9o9qa6j: 'Конкурентное преимущество компании',
        //                             e99qLNmjbj: 'Стратегические цели компании',
        //                             poFw7xdqZM:
        //                                 'Наша компания ориентирована на удовлетворение потребностей наших клиентов и достижение долгосрочного успеха за счет инноваций и качества продукта',
        //                             qPDxzvwePK:
        //                                 'Мы обладаем уникальными знаниями и опытом, которые позволяют нам выделяться на рынке и предоставлять нашим клиентам исключительное качество услуг',
        //                             uzlDOV84mx:
        //                                 'Наша миссия - стать лидером в нашей отрасли, предлагая продукты и услуги, которые отвечают самым высоким стандартам и ожиданиям наших клиентов',
        //                         },
        //                         title: 'Стратегия компании',
        //                     },
        //                 },
        //                 functions_state_id: '80b8dd84-87fe-4017-ad72-3b6882384bf6',
        //             },
        //             index: 0,
        //             finish_reason: 'function_call',
        //         },
        //     ],
        //     created: 1747807741,
        //     model: 'GigaChat-2:2.0.28.2',
        //     object: 'chat.completion',
        //     usage: {
        //         prompt_tokens: 587,
        //         completion_tokens: 209,
        //         total_tokens: 796,
        //         precached_prompt_tokens: 0,
        //     },
        // };

        // получаем аргументы функции
        const functionArgs = response.choices[0].message.function_call?.arguments;

        // создаем слайд из шаблона и аргументов
        const slide = createSlideFromTemplateWithContent({
            templateId: 'text-boxes-with-title',
            slotMapping,
            layoutsContents: functionArgs,
            title: 'Стратегия компании',
            options: { userId: '1', presentationId: '1' },
        });

        console.log(slide);
        //     {
        //         functions: [generateSlideContentFunction],
        //         function_call: { name: 'generate_slide_text' },
        //     }
        // );

        // let layouts = [];
        // if (response.function_call?.arguments) {
        //     const args = JSON.parse(response.function_call.arguments);
        //     layouts = parseGeneratedContent(args.layouts);
        // }

        // // Create slide structure with the generated content and template
        // const slide = createSlideFromTemplateWithContent('text-boxes-with-title', layouts, 'Стратегия компании');

        // console.log(slide);
    }, 120000);

    test('rewriteSlideContent', async () => {
        const slide = {
            id: 'lmm77362ogi',
            title: 'слайд с 3 плюсами применения ИИ в бизнесе',
            layouts: [
                {
                    id: 'kugx061mspg',
                    type: 'heading',
                    elements: [
                        {
                            id: 'tn49he',
                            elementTypeId: 'text',
                            textType: 'heading2',
                            content: '<p><span class="heading-text heading-2">Плюсы применения ИИ в бизнесе</span></p>',
                            cellId: '9h88hb598ff',
                        },
                    ],
                    style: {},
                    gridStructure: {
                        rows: [
                            {
                                id: 'o3mx6gfvo6m',
                                cells: [
                                    {
                                        id: '9h88hb598ff',
                                        row: 0,
                                        column: 0,
                                    },
                                ],
                            },
                        ],
                        columns: 1,
                        columnWidths: ['100%'],
                    },
                },
                {
                    id: 'j611969puk',
                    type: 'blank',
                    elements: [
                        {
                            id: '3i3vpa',
                            elementTypeId: 'text',
                            textType: 'bulletList',
                            content:
                                '<p><span>Повышение эффективности бизнеса через анализ данных и автоматизацию процессов, улучшение качества принимаемых решений на основе прогнозирования и оптимизации процессов, адаптация к изменениям на рынке и повышение конкурентоспособности компании</span></p>',
                            cellId: 'vknq52ncf8',
                        },
                    ],
                    style: {},
                    gridStructure: {
                        rows: [
                            {
                                id: '6ejd2rh600l',
                                cells: [
                                    {
                                        id: 'vknq52ncf8',
                                        row: 0,
                                        column: 0,
                                    },
                                ],
                            },
                        ],
                        columns: 1,
                        columnWidths: ['100%'],
                    },
                },
            ],
        } as Slide;

        const updateSlide = createRewriteSlideMapping(slide);
        console.log(updateSlide);
    });
});

import { FaImage, FaRegAddressCard } from 'react-icons/fa';
import { MdViewColumn } from 'react-icons/md';
import { SlideTemplateCore } from '@/types/templates';

// Единый реестр шаблонов
export const SlideTemplatesRegistry: Record<string, SlideTemplateCore> = {
    'image-text': {
        id: 'image-text',
        name: 'Изображение и текст',
        layout: 'image-text',
        elements: [
            {
                type: 'image',
                position: 'left',
                props: {
                    src: '',
                    alt: 'Image',
                    alignment: 'center',
                    width: undefined,
                },
                constraints: {
                    aspectRatio: '4:3',
                    required: true,
                },
                llmHints: {
                    purpose: 'Визуальное представление основной идеи или концепции',
                    contextRules: [
                        'Изображение должно быть напрямую связано с текстом справа',
                        'Избегать абстрактных или декоративных изображений',
                        'Изображение должно быть информативным и понятным',
                    ],
                },
            },
            {
                type: 'text',
                position: 'right',
                props: {
                    textType: 'text',
                    content: '<p>Текст слайда</p>',
                },
                constraints: {
                    maxLength: 300,
                    minLength: 50,
                    allowHtml: true,
                    allowedTags: ['p', 'strong', 'em'],
                },
                llmHints: {
                    purpose: 'Объяснение или описание концепции, показанной на изображении',
                    contextRules: [
                        'Текст должен объяснять или дополнять изображение',
                        'Использовать четкие и конкретные формулировки',
                        'Избегать общих фраз и клише',
                    ],
                },
            },
        ],
        ui: {
            category: 'image-text-templates',
            label: 'Изображение + текст',
            icon: FaImage,
            description: 'Шаблон с изображением слева и текстом справа',
        },
        llm: {
            description: 'Шаблон для визуального объяснения концепции, где изображение поддерживает текстовое описание',
            purpose: ['explanation', 'concept-illustration', 'feature-showcase'],
            useCases: [
                'Объяснение функциональности продукта',
                'Иллюстрация концепции с примером',
                'Представление ключевых особенностей',
            ],
        },
    },
    'text-image': {
        id: 'text-image',
        name: 'Текст и изображение',
        layout: 'text-image',
        elements: [
            {
                type: 'text',
                position: 'left',
                props: {
                    textType: 'text',
                    content: '<p>Текст слайда</p>',
                },
                constraints: {
                    maxLength: 300,
                    minLength: 50,
                    allowHtml: true,
                    allowedTags: ['p', 'strong', 'em'],
                },
                llmHints: {
                    purpose: 'Основное описание или объяснение',
                    contextRules: [
                        'Текст должен быть самодостаточным',
                        'Изображение справа должно иллюстрировать текст',
                    ],
                },
            },
            {
                type: 'image',
                position: 'right',
                props: {
                    src: '',
                    alt: 'Image',
                    alignment: 'center',
                    width: undefined,
                },
                constraints: {
                    aspectRatio: '4:3',
                    required: true,
                },
                llmHints: {
                    purpose: 'Иллюстрация описанной концепции',
                    contextRules: [
                        'Изображение должно визуально подкреплять текст слева',
                        'Выбирать изображения, усиливающие основные тезисы',
                    ],
                },
            },
        ],
        ui: {
            category: 'image-text-templates',
            label: 'Текст + изображение',
            icon: FaRegAddressCard,
            description: 'Шаблон с текстом слева и изображением справа',
        },
        llm: {
            description: 'Шаблон для подробного описания с последующей визуальной иллюстрацией',
            purpose: ['detailed-explanation', 'concept-breakdown', 'process-illustration'],
            useCases: [
                'Пошаговое объяснение процесса',
                'Описание характеристик продукта',
                'Представление результатов или последствий',
            ],
        },
    },
    'two-columns': {
        id: 'two-columns',
        name: 'Две колонки',
        layout: 'two-columns-equal',
        elements: [
            {
                type: 'text',
                position: 'left',
                props: {
                    textType: 'text',
                    content: '<p>Колонка 1</p>',
                },
                constraints: {
                    maxLength: 200,
                    minLength: 30,
                    allowHtml: true,
                },
                llmHints: {
                    purpose: 'Первый пункт сравнения или первая часть информации',
                    contextRules: [
                        'Содержимое должно быть сбалансировано с правой колонкой',
                        'Использовать параллельные структуры в обеих колонках',
                    ],
                },
            },
            {
                type: 'text',
                position: 'right',
                props: {
                    textType: 'text',
                    content: '<p>Колонка 2</p>',
                },
                constraints: {
                    maxLength: 200,
                    minLength: 30,
                    allowHtml: true,
                },
                llmHints: {
                    purpose: 'Второй пункт сравнения или вторая часть информации',
                    contextRules: [
                        'Поддерживать логическую связь с левой колонкой',
                        'Сохранять баланс объема контента',
                    ],
                },
            },
        ],
        ui: {
            category: 'column-templates',
            label: '2 колонки',
            icon: MdViewColumn,
            description: 'Шаблон с двумя равными колонками текста',
        },
        llm: {
            description: 'Шаблон для сравнения двух концепций или представления связанной информации',
            purpose: ['comparison', 'parallel-presentation', 'before-after'],
            useCases: ['Сравнение характеристик', 'До и После', 'Плюсы и Минусы', 'Причина и Следствие'],
        },
    },
    'three-columns': {
        id: 'three-columns',
        name: 'Три колонки',
        layout: 'three-columns',
        elements: [
            {
                type: 'text',
                position: 'left',
                props: {
                    textType: 'text',
                    content: '<p>Колонка 1</p>',
                },
                constraints: {
                    maxLength: 150,
                    minLength: 20,
                    allowHtml: true,
                },
                llmHints: {
                    purpose: 'Первый элемент последовательности или группы',
                    contextRules: [
                        'Поддерживать единую структуру во всех колонках',
                        'Использовать краткие, четкие формулировки',
                    ],
                },
            },
            {
                type: 'text',
                position: 'center',
                props: {
                    textType: 'text',
                    content: '<p>Колонка 2</p>',
                },
                constraints: {
                    maxLength: 150,
                    minLength: 20,
                    allowHtml: true,
                },
                llmHints: {
                    purpose: 'Второй элемент последовательности или группы',
                    contextRules: [
                        'Сохранять логическую связь с другими колонками',
                        'Поддерживать единый стиль изложения',
                    ],
                },
            },
            {
                type: 'text',
                position: 'right',
                props: {
                    textType: 'text',
                    content: '<p>Колонка 3</p>',
                },
                constraints: {
                    maxLength: 150,
                    minLength: 20,
                    allowHtml: true,
                },
                llmHints: {
                    purpose: 'Третий элемент последовательности или группы',
                    contextRules: ['Завершать логическую последовательность', 'Сохранять баланс с другими колонками'],
                },
            },
        ],
        ui: {
            category: 'column-templates',
            label: '3 колонки',
            icon: MdViewColumn,
            description: 'Шаблон с тремя равными колонками текста',
        },
        llm: {
            description: 'Шаблон для представления трех связанных концепций или последовательности шагов',
            purpose: ['sequence', 'triple-comparison', 'process-steps'],
            useCases: [
                'Три шага процесса',
                'Сравнение трех вариантов',
                'Прошлое, настоящее, будущее',
                'Проблема, решение, результат',
            ],
        },
    },
};

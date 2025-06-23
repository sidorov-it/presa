import { TextType } from '@/types';
import { ElementType } from '@/types/elements';
import { SlideTemplateCore } from '@/types/templates';
import {
    FaSquare,
    FaImage,
    FaRegAddressCard,
    FaColumns,
    FaList,
    FaHighlighter,
    FaThLarge,
    FaChartBar,
    FaTable,
} from 'react-icons/fa';
import { MdViewColumn } from 'react-icons/md';

// Единый реестр шаблонов
export const SlideTemplatesRegistry: Record<string, SlideTemplateCore> = {
    blank: {
        id: 'blank',
        name: 'Пустой слайд',
        layouts: [
            {
                layout: 'blank',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'content',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: '',
                        },

                        llmHints: {
                            purpose: 'Свободное размещение контента',
                            contextRules: [
                                'Возможность добавления любого типа контента',
                                'Гибкая структура без предопределенного форматирования',
                            ],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'basic-templates',
            label: 'Пустой слайд',
            icon: FaSquare,
            description: 'Пустой слайд для свободного размещения контента',
        },
        llm: {
            description: 'Базовый шаблон без предопределенной структуры',
            purpose: ['custom-content', 'flexible-layout'],
            useCases: ['Произвольный контент', 'Креативное оформление', 'Специальные макеты'],
        },
    },
    'image-text': {
        id: 'image-text',
        name: 'Изображение и текст',
        layouts: [
            {
                layout: 'image-text',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.IMAGE,
                        slot: 'main_image',
                        row: 0,
                        column: 0,
                        props: {
                            src: '',
                            alt: 'Image',
                            alignment: 'center',
                            width: undefined,
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
                        elementTypeId: ElementType.TEXT,
                        row: 0,
                        column: 1,
                        slot: 'main_text',
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Текст слайда',
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
        layouts: [
            {
                layout: 'text-image',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'main_text',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Текст слайда',
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
                        elementTypeId: ElementType.IMAGE,
                        row: 0,
                        column: 1,
                        slot: 'main_image',
                        props: {
                            src: '',
                            alt: 'Image',
                            alignment: 'center',
                            width: undefined,
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
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'heading',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING1,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },
                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'two-columns-equal',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'left_column_text',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 1',
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
                        elementTypeId: ElementType.TEXT,
                        slot: 'right_column_text',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 2',
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
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'heading',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING1,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },
                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'three-columns',
                columnsCount: 3,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'left_column_text',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 1',
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
                        elementTypeId: ElementType.TEXT,
                        slot: 'center_column_text',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 2',
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
                        elementTypeId: ElementType.TEXT,
                        slot: 'right_column_text',
                        row: 0,
                        column: 2,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 3',
                        },
                        llmHints: {
                            purpose: 'Третий элемент последовательности или группы',
                            contextRules: [
                                'Завершать логическую последовательность',
                                'Сохранять баланс с другими колонками',
                            ],
                        },
                    },
                ],
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
    'two-columns-headings': {
        id: 'two-columns-headings',
        name: 'Две колонки с заголовками',
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'heading',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING1,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },
                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'two-columns-headings',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_1_heading',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING4,
                            content: 'Заголовок 1 (символ ####)',
                        },
                        llmHints: {
                            purpose: 'Заголовок первой колонки',
                            contextRules: ['Краткий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_1_content',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Содержимое колонки 1',
                        },
                        llmHints: {
                            purpose: 'Основной текст первой колонки',
                            contextRules: ['Связь с заголовком', 'Баланс с правой колонкой'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_2_heading',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.HEADING4,
                            content: 'Заголовок 2 (символ ####)',
                        },
                        llmHints: {
                            purpose: 'Заголовок второй колонки',
                            contextRules: ['Краткий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_2_content',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Содержимое колонки 2',
                        },
                        llmHints: {
                            purpose: 'Основной текст второй колонки',
                            contextRules: ['Связь с заголовком', 'Баланс с левой колонкой'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'column-templates',
            label: '2 колонки с заголовками',
            icon: FaColumns,
            description: 'Шаблон с двумя колонками и заголовками',
        },
        llm: {
            description: 'Шаблон для сравнения двух тем с отдельными заголовками',
            purpose: ['comparison', 'parallel-topics'],
            useCases: ['Сравнение характеристик', 'Параллельные темы', 'Преимущества и недостатки'],
        },
    },
    'three-columns-headings': {
        id: 'three-columns-headings',
        name: 'Три колонки с заголовками',
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'heading',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING1,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },
                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'three-columns-headings',
                columnsCount: 3,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_1_heading',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING4,
                            content: 'Заголовок 1 (символ ####)',
                        },
                        llmHints: {
                            purpose: 'Заголовок первой колонки',
                            contextRules: ['Краткий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_1_content',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Содержимое колонки 1',
                        },
                        llmHints: {
                            purpose: 'Основной текст первой колонки',
                            contextRules: ['Связь с заголовком', 'Баланс с другими колонками'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_2_heading',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.HEADING4,
                            content: 'Заголовок 2 (символ ####)',
                        },
                        llmHints: {
                            purpose: 'Заголовок второй колонки',
                            contextRules: ['Краткий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_2_content',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Содержимое колонки 2',
                        },
                        llmHints: {
                            purpose: 'Основной текст второй колонки',
                            contextRules: ['Связь с заголовком', 'Баланс с другими колонками'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_3_heading',
                        row: 0,
                        column: 2,
                        props: {
                            textType: TextType.HEADING4,
                            content: 'Заголовок 3 (символ ####)',
                        },
                        llmHints: {
                            purpose: 'Заголовок третьей колонки',
                            contextRules: ['Краткий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_3_content',
                        row: 0,
                        column: 2,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Содержимое колонки 3',
                        },
                        llmHints: {
                            purpose: 'Основной текст третьей колонки',
                            contextRules: ['Связь с заголовком', 'Баланс с другими колонками'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'column-templates',
            label: '3 колонки с заголовками',
            icon: FaColumns,
            description: 'Шаблон с тремя колонками и заголовками',
        },
        llm: {
            description: 'Шаблон для представления трех связанных тем с заголовками',
            purpose: ['comparison', 'sequence', 'categories'],
            useCases: ['Этапы процесса', 'Категории', 'Временная последовательность'],
        },
    },
    'four-columns': {
        id: 'four-columns',
        name: 'Четыре колонки',
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'heading',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING1,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },
                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'four-columns',
                columnsCount: 4,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_1_text',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 1',
                        },
                        llmHints: {
                            purpose: 'Первый элемент из четырех',
                            contextRules: ['Краткость', 'Единый формат с другими колонками'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_2_text',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 2',
                        },
                        llmHints: {
                            purpose: 'Второй элемент из четырех',
                            contextRules: ['Краткость', 'Единый формат с другими колонками'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_3_text',
                        row: 0,
                        column: 2,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 3',
                        },
                        llmHints: {
                            purpose: 'Третий элемент из четырех',
                            contextRules: ['Краткость', 'Единый формат с другими колонками'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'column_4_text',
                        row: 0,
                        column: 3,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 4',
                        },
                        llmHints: {
                            purpose: 'Четвертый элемент из четырех',
                            contextRules: ['Краткость', 'Единый формат с другими колонками'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'column-templates',
            label: '4 колонки',
            icon: FaColumns,
            description: 'Шаблон с четырьмя равными колонками',
        },
        llm: {
            description: 'Шаблон для представления четырех связанных элементов',
            purpose: ['comparison', 'categories', 'features'],
            useCases: ['Сравнение четырех вариантов', 'Категории', 'Характеристики'],
        },
    },
    'title-bullets': {
        id: 'title-bullets',
        name: 'Заголовок с пунктами',
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },
                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'blank',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'bullets',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.BULLET_LIST,
                            content: ['Пункт 1', 'Пункт 2', 'Пункт 3'],
                        },

                        llmHints: {
                            purpose: 'Список ключевых пунктов',
                            contextRules: [
                                'Краткие, четкие формулировки',
                                'Логическая последовательность',
                                'Единообразное форматирование',
                            ],
                            examples: [
                                `<bullet>Пункт 1</bullet>
                                <bullet>Пункт 2</bullet>
                                <bullet>Пункт 3</bullet>`,
                            ],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'list-templates',
            label: 'Заголовок с пунктами',
            icon: FaList,
            description: 'Шаблон с заголовком и маркированным списком',
        },
        llm: {
            description: 'Шаблон для представления списка ключевых пунктов с заголовком',
            purpose: ['list', 'key-points', 'summary'],
            useCases: ['Ключевые моменты', 'Список преимуществ', 'Основные пункты'],
        },
    },
    'title-bullets-image': {
        id: 'title-bullets-image',
        name: 'Заголовок с пунктами и изображением',
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,

                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },

                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'two-columns-equal',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'bullets',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.BULLET_LIST,
                            content: ['Пункт 1', 'Пункт 2', 'Пункт 3'],
                        },

                        llmHints: {
                            purpose: 'Список ключевых пунктов',
                            contextRules: [
                                'Краткие, четкие формулировки',
                                'Связь с изображением',
                                'Единообразное форматирование',
                            ],
                        },
                    },
                    {
                        elementTypeId: ElementType.IMAGE,
                        slot: 'image',
                        row: 0,
                        column: 1,
                        props: {
                            src: '',
                            alt: 'Image',
                            alignment: 'center',
                            width: undefined,
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
            },
        ],
        ui: {
            category: 'list-templates',
            label: 'Заголовок с пунктами и изображением',
            icon: FaList,
            description: 'Шаблон с заголовком, маркированным списком и изображением',
        },
        llm: {
            description: 'Шаблон для представления списка ключевых пунктов с заголовком и поясняющим изображением',
            purpose: ['list-with-visual', 'key-points-illustrated', 'visual-summary'],
            useCases: [
                'Иллюстрированные ключевые моменты',
                'Визуальное подкрепление списка',
                'Наглядное представление преимуществ',
            ],
        },
    },
    'accent-left': {
        id: 'accent-left',
        name: 'Акцент слева',
        layouts: [
            {
                layout: 'accent-left',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'accent',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Акцентный текст (символ ##)',
                            style: {
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                            },
                        },

                        llmHints: {
                            purpose: 'Акцентный текст или заголовок',
                            contextRules: ['Краткая, запоминающаяся фраза', 'Ключевое сообщение или цифра'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'main_content',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Основной текст слайда',
                        },

                        llmHints: {
                            purpose: 'Детальное объяснение акцентного текста',
                            contextRules: ['Раскрытие смысла акцентной фразы', 'Поддерживающие детали и объяснения'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'accent-templates',
            label: 'Акцент слева',
            icon: FaHighlighter,
            description: 'Шаблон с акцентным текстом слева',
        },
        llm: {
            description: 'Шаблон для выделения важной информации с акцентом слева',
            purpose: ['emphasis', 'key-message', 'statistics'],
            useCases: ['Ключевые цифры', 'Важные утверждения', 'Статистика'],
        },
    },

    'accent-right': {
        id: 'accent-right',
        name: 'Акцент справа',
        layouts: [
            {
                layout: 'accent-right',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'main_content',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Основной текст слайда',
                        },

                        llmHints: {
                            purpose: 'Основной контент, ведущий к акценту',
                            contextRules: ['Логическое построение к акцентной части', 'Контекст для понимания акцента'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'accent',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Акцентный текст (символ ##)',
                            style: {
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                            },
                        },

                        llmHints: {
                            purpose: 'Акцентный текст или заголовок',
                            contextRules: ['Итоговая мысль или вывод', 'Ключевой результат'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'accent-templates',
            label: 'Акцент справа',
            icon: FaHighlighter,
            description: 'Шаблон с акцентным текстом справа',
        },
        llm: {
            description: 'Шаблон для выделения важной информации с акцентом справа',
            purpose: ['emphasis', 'conclusion', 'result'],
            useCases: ['Выводы', 'Результаты', 'Ключевые достижения'],
        },
    },

    'accent-top': {
        id: 'accent-top',
        name: 'Акцент сверху',
        layouts: [
            {
                layout: 'accent-top',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'accent',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок слайда (символ ## в markdown)',
                            style: {
                                fontSize: '3rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                            },
                        },

                        llmHints: {
                            purpose: 'Слайд с фоновым изоюражением сверху (изображение занимает 1/4 слайда)',
                            contextRules: ['Основная мысль или тема', 'Привлекающий внимание заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'main_content',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Основной текст слайда',
                        },

                        llmHints: {
                            purpose: 'Раскрытие акцентной темы',
                            contextRules: ['Подробное объяснение', 'Развитие основной мысли'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'accent-templates',
            label: 'Акцент сверху',
            icon: FaHighlighter,
            description: 'Шаблон с акцентным текстом сверху',
        },
        llm: {
            description: 'Шаблон для выделения важной информации с акцентом сверху',
            purpose: ['emphasis', 'introduction', 'topic'],
            useCases: ['Заголовки разделов', 'Ключевые темы', 'Основные идеи'],
        },
    },

    'accent-right-fit': {
        id: 'accent-right-fit',
        name: 'Акцент справа (компактный)',
        layouts: [
            {
                layout: 'accent-right-fit',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'main_content',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Основной текст слайда',
                        },

                        llmHints: {
                            purpose: 'Детальное описание',
                            contextRules: ['Подробное объяснение контекста', 'Развернутая информация'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'accent',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING3,
                            content: 'Акцентный текст (символ ###)',
                            style: {
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                            },
                        },

                        llmHints: {
                            purpose: 'Компактный акцент',
                            contextRules: ['Краткое выделение важной информации', 'Ключевые моменты в сжатой форме'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'accent-templates',
            label: 'Акцент справа (компактный)',
            icon: FaHighlighter,
            description: 'Шаблон с компактным акцентным текстом справа',
        },
        llm: {
            description: 'Шаблон для компактного выделения информации с акцентом справа',
            purpose: ['emphasis', 'highlight', 'summary'],
            useCases: ['Краткие выводы', 'Ключевые цитаты', 'Важные заметки'],
        },
    },

    'accent-left-fit': {
        id: 'accent-left-fit',
        name: 'Акцент слева (компактный)',
        layouts: [
            {
                layout: 'accent-left-fit',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'accent',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING3,
                            content: 'Акцентный текст (символ ###)',
                            style: {
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                            },
                        },

                        llmHints: {
                            purpose: 'Компактный акцент',
                            contextRules: ['Краткое выделение важной информации', 'Ключевые моменты в сжатой форме'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'main_content',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Основной текст слайда',
                        },

                        llmHints: {
                            purpose: 'Детальное описание',
                            contextRules: ['Подробное объяснение контекста', 'Развернутая информация'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'accent-templates',
            label: 'Акцент слева (компактный)',
            icon: FaHighlighter,
            description: 'Шаблон с компактным акцентным текстом слева',
        },
        llm: {
            description: 'Шаблон для компактного выделения информации с акцентом слева',
            purpose: ['emphasis', 'highlight', 'introduction'],
            useCases: ['Вводные заметки', 'Ключевые определения', 'Важные термины'],
        },
    },

    'accent-background': {
        id: 'accent-background',
        name: 'Акцент на фоне',
        layouts: [
            {
                layout: 'accent-background',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'accent',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Акцентный текст (символ ##)',
                            style: {
                                fontSize: '3.5rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                            },
                        },

                        llmHints: {
                            purpose: 'Главный акцент на всём слайде',
                            contextRules: ['Одна ключевая мысль', 'Максимально сильный акцент'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'subtitle',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Поясняющий текст',
                            style: {
                                fontSize: '1.5rem',
                                opacity: 0.9,
                            },
                        },

                        llmHints: {
                            purpose: 'Краткое пояснение к акценту',
                            contextRules: ['Минимальное необходимое пояснение', 'Поддержка основного акцента'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'accent-templates',
            label: 'Акцент на фоне',
            icon: FaHighlighter,
            description: 'Шаблон с акцентным текстом на всём слайде',
        },
        llm: {
            description: 'Шаблон для максимального акцента на важной информации',
            purpose: ['emphasis', 'statement', 'quote'],
            useCases: ['Ключевые заявления', 'Важные цитаты', 'Главные выводы'],
        },
    },

    'two-image-columns': {
        id: 'two-image-columns',
        name: '2 колонки с изображениями',
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },

                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'two-columns-equal',
                columnsCount: 2,
                rowsCount: 1,
                elements: [
                    // изображение
                    {
                        elementTypeId: ElementType.IMAGE,
                        slot: 'image_left_column',
                        row: 0,
                        column: 0,
                        props: {
                            src: '',
                            alt: 'Image',
                            alignment: 'center',
                            width: undefined,
                        },
                        llmHints: {
                            purpose: 'Иллюстрация описанной концепции',
                            contextRules: [
                                'Изображение должно визуально подкреплять текст слева',
                                'Выбирать изображения, усиливающие основные тезисы',
                            ],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title_left_column',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING3,
                            content: 'Заголовок левой колонки (символ ###)',
                        },

                        llmHints: {
                            purpose: 'Заголовок левой колонки',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'text_left_column',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 1',
                        },
                        llmHints: {
                            purpose: 'Второй элемент из четырех',
                            contextRules: ['Краткость', 'Единый формат с другими колонками'],
                        },
                    },

                    {
                        elementTypeId: ElementType.IMAGE,
                        slot: 'image_right_column',
                        row: 0,
                        column: 1,
                        props: {
                            src: '',
                            alt: 'Image',
                            alignment: 'center',
                            width: undefined,
                        },
                        llmHints: {
                            purpose: 'Иллюстрация описанной концепции',
                            contextRules: [
                                'Изображение должно визуально подкреплять текст слева',
                                'Выбирать изображения, усиливающие основные тезисы',
                            ],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title_right_column',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.HEADING3,
                            content: 'Заголовок правой колонки (символ ###)',
                        },

                        llmHints: {
                            purpose: 'Заголовок левой колонки',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'text_right_column',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 2',
                        },
                        llmHints: {
                            purpose: 'Второй элемент из четырех',
                            contextRules: ['Краткость', 'Единый формат с другими колонками'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'image-templates',
            label: '2 колонки с изображениями',
            icon: FaThLarge,
            description: 'Шаблон с двумя колонками изображений и текста',
        },
        llm: {
            description: 'Шаблон для сравнения двух концепций с визуальным представлением',
            purpose: ['comparison', 'visual-contrast', 'feature-showcase'],
            useCases: ['Сравнение продуктов', 'До и После', 'Варианты решения'],
        },
    },

    'three-image-columns': {
        id: 'three-image-columns',
        name: '3 колонки с изображениями',
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },

                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'three-columns',
                columnsCount: 3,
                rowsCount: 1,
                elements: [
                    // изображение
                    {
                        elementTypeId: ElementType.IMAGE,
                        slot: 'image_left_column',
                        row: 0,
                        column: 0,
                        props: {
                            src: '',
                            alt: 'Image',
                            alignment: 'center',
                            width: undefined,
                        },
                        llmHints: {
                            purpose: 'Иллюстрация описанной концепции',
                            contextRules: [
                                'Изображение должно визуально подкреплять текст слева',
                                'Выбирать изображения, усиливающие основные тезисы',
                            ],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title_left_column',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING3,
                            content: 'Заголовок левой колонки (символ ###)',
                        },

                        llmHints: {
                            purpose: 'Заголовок левой колонки',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'text_left_column',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 1',
                        },
                        llmHints: {
                            purpose: 'Второй элемент из четырех',
                            contextRules: ['Краткость', 'Единый формат с другими колонками'],
                        },
                    },

                    {
                        elementTypeId: ElementType.IMAGE,
                        slot: 'image_center_column',
                        row: 0,
                        column: 1,
                        props: {
                            src: '',
                            alt: 'Image',
                            alignment: 'center',
                            width: undefined,
                        },
                        llmHints: {
                            purpose: 'Иллюстрация описанной концепции',
                            contextRules: [
                                'Изображение должно визуально подкреплять текст слева',
                                'Выбирать изображения, усиливающие основные тезисы',
                            ],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title_center_column',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.HEADING3,
                            content: 'Заголовок правой колонки (символ ###)',
                        },

                        llmHints: {
                            purpose: 'Заголовок левой колонки',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'text_center_column',
                        row: 0,
                        column: 1,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 2',
                        },
                        llmHints: {
                            purpose: 'Второй элемент из четырех',
                            contextRules: ['Краткость', 'Единый формат с другими колонками'],
                        },
                    },

                    {
                        elementTypeId: ElementType.IMAGE,
                        slot: 'image_right_column',
                        row: 0,
                        column: 2,
                        props: {
                            src: '',
                            alt: 'Image',
                            alignment: 'center',
                            width: undefined,
                        },
                        llmHints: {
                            purpose: 'Иллюстрация описанной концепции',
                            contextRules: [
                                'Изображение должно визуально подкреплять текст слева',
                                'Выбирать изображения, усиливающие основные тезисы',
                            ],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title_right_column',
                        row: 0,
                        column: 2,
                        props: {
                            textType: TextType.HEADING3,
                            content: 'Заголовок правой колонки (символ ###)',
                        },

                        llmHints: {
                            purpose: 'Заголовок левой колонки',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'text_right_column',
                        row: 0,
                        column: 2,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Колонка 3',
                        },
                        llmHints: {
                            purpose: 'Второй элемент из четырех',
                            contextRules: ['Краткость', 'Единый формат с другими колонками'],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'image-templates',
            label: '3 колонки с изображениями',
            icon: FaThLarge,
            description: 'Шаблон с тремя колонками изображений и текста',
        },
        llm: {
            description: 'Шаблон для представления трех связанных концепций с визуализацией',
            purpose: ['sequence', 'process-steps', 'feature-set'],
            useCases: ['Этапы процесса', 'Набор функций', 'Варианты выбора'],
        },
    },

    'images-with-title': {
        id: 'images-with-title',
        name: 'Изображения с заголовком',
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },

                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'blank',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.SMART_LAYOUT,
                        elementVariant: 'images-with-text',
                        slot: 'content',
                        row: 0,
                        column: 0,
                        props: {
                            columnSize: 3,
                            align: 'center',
                            imageShape: 'square',
                            imageSize: 5,
                            items: [
                                {
                                    id: 'item1',
                                    title: '<p><span class="heading-text heading-3">Заголовок 1</span></p>',
                                    text: '<p>Описание изображения 1</p>',
                                    imageUrl: '',
                                },
                                {
                                    id: 'item2',
                                    title: '<p><span class="heading-text heading-3">Заголовок 2</span></p>',
                                    text: '<p>Описание изображения 2</p>',
                                    imageUrl: '',
                                },
                                {
                                    id: 'item3',
                                    title: '<p><span class="heading-text heading-3">Заголовок 3</span></p>',
                                    text: '<p>Описание изображения 3</p>',
                                    imageUrl: '',
                                },
                            ],
                            itemsSchema: [
                                {
                                    key: 'title',
                                    type: ElementType.TEXT,
                                    variant: TextType.HEADING3,
                                },
                                {
                                    key: 'text',
                                    type: ElementType.TEXT,
                                    variant: TextType.DEFAULT,
                                },
                                {
                                    key: 'imageUrl',
                                    type: ElementType.IMAGE,
                                    linkedContentFields: ['title', 'text'],
                                },
                            ],
                            // itemImages: [
                            //     {
                            //         key: 'imageUrl',
                            //         linkedContentFields: ['title', 'text'],
                            //     },
                            // ],
                        },

                        llmHints: {
                            purpose: 'Визуальное представление трех связанных элементов',
                            contextRules: [
                                'Изображения должны поддерживать общую тему',
                                'Подзаголовки должны быть связаны с основным заголовком',
                                'Описания должны быть информативными',
                            ],
                            items: {
                                title: {
                                    type: 'string',
                                    description: 'Заголовок изображения',
                                },
                                text: {
                                    type: 'string',
                                    description: 'Описание изображения',
                                },
                                imageUrl: {
                                    type: 'string',
                                    description: 'URL изображения',
                                },
                            },
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'image-templates',
            label: 'Изображения с заголовком',
            icon: FaThLarge,
            description: 'Шаблон с заголовком и тремя колонками изображений',
        },
        llm: {
            description: 'Шаблон для представления группы связанных элементов с общим заголовком',
            purpose: ['grouped-content', 'feature-showcase', 'category-overview'],
            useCases: ['Обзор категорий', 'Набор функций', 'Примеры использования'],
        },
    },

    'text-boxes-with-title': {
        id: 'text-boxes-with-title',
        name: 'Текстовые блоки с заголовком',
        layouts: [
            {
                layout: 'heading',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок слайда (символ ## в markdown)',
                        },

                        llmHints: {
                            purpose: 'Основной Заголовок слайда (символ ## в markdown)',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },

            {
                layout: 'text-boxes-with-title',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.SMART_LAYOUT,
                        elementVariant: 'text-boxes',
                        slot: 'content',
                        row: 0,
                        column: 0,
                        props: {
                            columnSize: 3,
                            align: 'center',
                            items: [
                                {
                                    id: 'item1',
                                    title: '<p><span class="heading-text heading-3">Блок 1</span></p>',
                                    text: '<p>Содержимое блока 1</p>',
                                },
                                {
                                    id: 'item2',
                                    title: '<p><span class="heading-text heading-3">Блок 2</span></p>',
                                    text: '<p>Содержимое блока 2</p>',
                                },
                                {
                                    id: 'item3',
                                    title: '<p><span class="heading-text heading-3">Блок 3</span></p>',
                                    text: '<p>Содержимое блока 3</p>',
                                },
                            ],
                            itemsSchema: [
                                {
                                    key: 'title',
                                    type: ElementType.TEXT,
                                    variant: TextType.HEADING3,
                                },
                                {
                                    key: 'text',
                                    type: ElementType.TEXT,
                                    variant: TextType.DEFAULT,
                                },
                            ],
                        },

                        llmHints: {
                            purpose: 'Структурированное представление информации в блоках',
                            contextRules: [
                                'Блоки должны быть связаны общей темой',
                                'Заголовки блоков должны быть информативными',
                                'Содержимое должно быть кратким и четким',
                            ],
                            items: {
                                title: {
                                    type: 'string',
                                    description: 'Заголовок изображения',
                                },
                                text: {
                                    type: 'string',
                                    description: 'Описание изображения',
                                },
                                imageUrl: {
                                    type: 'string',
                                    description: 'URL изображения',
                                },
                            },
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'text-templates',
            label: 'Текстовые блоки с заголовком',
            icon: FaColumns,
            description: 'Шаблон с заголовком и текстовыми блоками',
        },
        llm: {
            description: 'Шаблон для структурированного представления информации в текстовых блоках',
            purpose: ['structured-content', 'information-blocks', 'key-points'],
            useCases: ['Ключевые моменты', 'Преимущества', 'Характеристики'],
        },
    },

    'bar-chart': {
        id: 'bar-chart',
        name: 'Столбчатая диаграмма',
        layouts: [
            {
                layout: 'bar-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок диаграммы (символ ##)',
                        },

                        llmHints: {
                            purpose: 'Заголовок диаграммы',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'bar-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.CHART,
                        slot: 'chart',
                        row: 0,
                        column: 0,
                        props: {
                            elementVariant: 'bar',
                            data: [
                                { name: 'Категория 1', value: 400 },
                                { name: 'Категория 2', value: 300 },
                                { name: 'Категория 3', value: 500 },
                                { name: 'Категория 4', value: 200 },
                            ],
                            series: [
                                {
                                    key: 'value',
                                    label: 'Значение',
                                },
                            ],
                            showLabels: true,
                            showValues: true,
                            legendPosition: 'right',
                            alignment: 'center',
                        },

                        llmHints: {
                            purpose: 'Визуализация числовых данных в виде столбцов',
                            contextRules: [
                                'Данные должны быть представлены четко и понятно',
                                'Категории должны быть логически связаны',
                                'Значения должны быть значимыми для сравнения',
                            ],
                        },
                    },
                ],
            },
            {
                layout: 'bar-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'description',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Описание диаграммы и ключевые выводы',
                        },

                        llmHints: {
                            purpose: 'Пояснение к диаграмме',
                            contextRules: [
                                'Объяснение значимых данных',
                                'Выделение ключевых трендов',
                                'Формулировка выводов',
                            ],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'chart-templates',
            label: 'Столбчатая диаграмма',
            icon: FaChartBar,
            description: 'Шаблон со столбчатой диаграммой',
        },
        llm: {
            description: 'Шаблон для визуализации данных в виде столбчатой диаграммы',
            purpose: ['data-visualization', 'comparison', 'trends'],
            useCases: ['Сравнение показателей', 'Динамика изменений', 'Распределение значений'],
        },
    },

    'line-chart': {
        id: 'line-chart',
        name: 'Линейная диаграмма',
        layouts: [
            {
                layout: 'blank',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок диаграммы (символ ##)',
                        },

                        llmHints: {
                            purpose: 'Заголовок диаграммы',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },

            {
                layout: 'line-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.CHART,
                        slot: 'chart',
                        row: 0,
                        column: 0,
                        props: {
                            elementVariant: 'line',
                            data: [
                                { name: 'Точка 1', value: 400 },
                                { name: 'Точка 2', value: 300 },
                                { name: 'Точка 3', value: 500 },
                                { name: 'Точка 4', value: 200 },
                            ],
                            series: [
                                {
                                    key: 'value',
                                    label: 'Значение',
                                },
                            ],
                            showLabels: true,
                            showValues: true,
                            legendPosition: 'right',
                            alignment: 'center',
                        },

                        llmHints: {
                            purpose: 'Визуализация тренда или изменения значений',
                            contextRules: [
                                'Данные должны показывать изменение во времени или последовательности',
                                'Точки должны быть логически связаны',
                                'Значения должны отражать динамику',
                            ],
                        },
                    },
                ],
            },

            {
                layout: 'line-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'description',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Описание тренда и ключевые выводы',
                        },

                        llmHints: {
                            purpose: 'Пояснение к диаграмме',
                            contextRules: [
                                'Описание наблюдаемого тренда',
                                'Объяснение ключевых точек изменения',
                                'Прогноз или выводы',
                            ],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'chart-templates',
            label: 'Линейная диаграмма',
            icon: FaChartBar,
            description: 'Шаблон с линейной диаграммой',
        },
        llm: {
            description: 'Шаблон для визуализации трендов и изменений во времени',
            purpose: ['trend-visualization', 'time-series', 'progression'],
            useCases: ['Динамика показателей', 'Временные ряды', 'Прогрессия значений'],
        },
    },

    'pie-chart': {
        id: 'pie-chart',
        name: 'Круговая диаграмма',
        layouts: [
            {
                layout: 'pie-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок диаграммы (символ ##)',
                        },

                        llmHints: {
                            purpose: 'Заголовок диаграммы',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },

            {
                layout: 'pie-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.CHART,
                        slot: 'chart',
                        row: 0,
                        column: 0,
                        props: {
                            elementVariant: 'pie',
                            data: [
                                { name: 'Сегмент 1', value: 400 },
                                { name: 'Сегмент 2', value: 300 },
                                { name: 'Сегмент 3', value: 500 },
                                { name: 'Сегмент 4', value: 200 },
                            ],
                            series: [
                                {
                                    key: 'value',
                                    label: 'Значение',
                                },
                            ],
                            showLabels: true,
                            showValues: true,
                            legendPosition: 'right',
                            alignment: 'center',
                        },

                        llmHints: {
                            purpose: 'Визуализация долей или процентного распределения',
                            contextRules: [
                                'Сегменты должны в сумме составлять целое',
                                'Названия сегментов должны быть понятными',
                                'Значения должны быть значимыми для сравнения',
                            ],
                        },
                    },
                ],
            },

            {
                layout: 'pie-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'description',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Описание распределения и ключевые выводы',
                        },

                        llmHints: {
                            purpose: 'Пояснение к диаграмме',
                            contextRules: [
                                'Объяснение значимых сегментов',
                                'Выделение основных пропорций',
                                'Формулировка выводов',
                            ],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'chart-templates',
            label: 'Круговая диаграмма',
            icon: FaChartBar,
            description: 'Шаблон с круговой диаграммой',
        },
        llm: {
            description: 'Шаблон для визуализации долей и процентного распределения',
            purpose: ['distribution', 'proportion', 'share-analysis'],
            useCases: ['Распределение бюджета', 'Доли рынка', 'Структура портфеля'],
        },
    },

    'donut-chart': {
        id: 'donut-chart',
        name: 'Кольцевая диаграмма',
        layouts: [
            {
                layout: 'donut-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок диаграммы (символ ##)',
                        },

                        llmHints: {
                            purpose: 'Заголовок диаграммы',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'donut-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.CHART,
                        slot: 'chart',
                        row: 0,
                        column: 0,
                        props: {
                            elementVariant: 'donut',
                            data: [
                                { name: 'Сегмент 1', value: 400 },
                                { name: 'Сегмент 2', value: 300 },
                                { name: 'Сегмент 3', value: 500 },
                                { name: 'Сегмент 4', value: 200 },
                            ],
                            series: [
                                {
                                    key: 'value',
                                    label: 'Значение',
                                },
                            ],
                            showLabels: true,
                            showValues: true,
                            legendPosition: 'right',
                            alignment: 'center',
                        },

                        llmHints: {
                            purpose: 'Визуализация долей с центральным пространством',
                            contextRules: [
                                'Сегменты должны в сумме составлять целое',
                                'Названия сегментов должны быть понятными',
                                'Значения должны быть значимыми для сравнения',
                            ],
                        },
                    },
                ],
            },
            {
                layout: 'donut-chart',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'description',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Описание распределения и ключевые выводы',
                        },

                        llmHints: {
                            purpose: 'Пояснение к диаграмме',
                            contextRules: [
                                'Объяснение значимых сегментов',
                                'Выделение основных пропорций',
                                'Формулировка выводов',
                            ],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'chart-templates',
            label: 'Кольцевая диаграмма',
            icon: FaChartBar,
            description: 'Шаблон с кольцевой диаграммой',
        },
        llm: {
            description: 'Шаблон для визуализации долей с центральным пространством',
            purpose: ['distribution', 'proportion', 'share-analysis'],
            useCases: ['Распределение ресурсов', 'Структура данных', 'Анализ компонентов'],
        },
    },

    'three-row-table': {
        id: 'three-row-table',
        name: 'Таблица 3x3',
        layouts: [
            {
                layout: 'three-row-table',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'title',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.HEADING2,
                            content: 'Заголовок таблицы (символ ##)',
                        },

                        llmHints: {
                            purpose: 'Заголовок таблицы',
                            contextRules: ['Четкий, информативный заголовок'],
                        },
                    },
                ],
            },
            {
                layout: 'three-row-table',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TABLE,
                        elementVariant: 'table',
                        row: 0,
                        column: 0,
                        slot: 'content',
                        props: {
                            headers: ['Колонка 1', 'Колонка 2', 'Колонка 3'],
                            rows: [
                                ['Ячейка 1,1', 'Ячейка 1,2', 'Ячейка 1,3'],
                                ['Ячейка 2,1', 'Ячейка 2,2', 'Ячейка 2,3'],
                                ['Ячейка 3,1', 'Ячейка 3,2', 'Ячейка 3,3'],
                            ],
                            style: {
                                headerBackground: 'var(--primary-color)',
                                headerTextColor: 'white',
                                borderColor: 'var(--border-color)',
                                alternateRowBackground: true,
                            },
                        },

                        llmHints: {
                            purpose: 'Структурированное представление данных в таблице',
                            contextRules: [
                                'Заголовки колонок должны быть информативными',
                                'Данные должны быть логически организованы',
                                'Содержимое ячеек должно быть кратким',
                            ],
                            items: {
                                title: {
                                    type: 'string',
                                    description: 'Заголовок изображения',
                                },
                                text: {
                                    type: 'string',
                                    description: 'Описание изображения',
                                },
                                imageUrl: {
                                    type: 'string',
                                    description:
                                        'Инструкция для генерации изображения, связанного с текстами в данном блоке',
                                },
                            },
                        },
                    },
                ],
            },
            {
                layout: 'three-row-table',
                columnsCount: 1,
                rowsCount: 1,
                elements: [
                    {
                        elementTypeId: ElementType.TEXT,
                        slot: 'description',
                        row: 0,
                        column: 0,
                        props: {
                            textType: TextType.DEFAULT,
                            content: 'Описание данных и ключевые выводы',
                        },

                        llmHints: {
                            purpose: 'Пояснение к таблице',
                            contextRules: [
                                'Объяснение представленных данных',
                                'Выделение важных закономерностей',
                                'Формулировка выводов',
                            ],
                        },
                    },
                ],
            },
        ],
        ui: {
            category: 'table-templates',
            label: 'Таблица 3x3',
            icon: FaTable,
            description: 'Шаблон с таблицей 3x3',
        },
        llm: {
            description: 'Шаблон для структурированного представления данных в таблице 3x3',
            purpose: ['data-organization', 'comparison', 'structured-info'],
            useCases: ['Сравнительный анализ', 'Матрица данных', 'Структурированная информация'],
        },
    },
};

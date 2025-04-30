import { FaFont, FaTable, FaList, FaBox, FaImage, FaRegChartBar, FaQuoteLeft, FaLayerGroup } from 'react-icons/fa';

import editorsDefaultContent from './textEditor/defaultContent';

export interface MenuCategory {
    id: string;
    label: string;
    Icon?: React.ComponentType;
    subCategories?: MenuSubCategory[];
    elements?: MenuItem[];
}

export interface MenuSubCategory {
    id: string;
    label: string;
    elements: MenuItem[];
}

export interface MenuItem {
    elementTypeId: string;
    label: string;
    Icon?: React.ComponentType;
    defaultProps?: Record<string, any>;
}

export const BoxCategories = {
    id: 'boxes',
    label: 'Блоки',
    elements: [
        {
            elementTypeId: 'box',
            label: 'Блок с заметкой',
            Icon: FaBox,
            defaultProps: {
                iconType: 'note-box',
                content: editorsDefaultContent.box,
                backgroundColor: '#bbb8fa',
                darkBackgroundColor: '#01004d',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Информационный блок',
            Icon: FaBox,
            defaultProps: {
                iconType: 'info-box',
                content: editorsDefaultContent.infoBox,
                backgroundColor: '#b6d6fc',
                darkBackgroundColor: '#032349',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Блок с предупреждением',
            Icon: FaBox,
            defaultProps: {
                iconType: 'warning-box',
                content: editorsDefaultContent.warningBox,
                backgroundColor: '#fcf2b5',
                darkBackgroundColor: '#032349',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Блок с предостережением',
            Icon: FaBox,
            defaultProps: {
                iconType: 'caution-box',
                content: editorsDefaultContent.cautionBox,
                backgroundColor: '#ffb3b3',
                darkBackgroundColor: '#4a3f03',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Блок с успехом',
            Icon: FaBox,
            defaultProps: {
                iconType: 'success-box',
                content: editorsDefaultContent.successBox,
                backgroundColor: '#b5fcb8',
                darkBackgroundColor: '#183a13',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Блок с вопросом',
            Icon: FaBox,
            defaultProps: {
                iconType: 'question-box',
                content: editorsDefaultContent.questionBox,
                backgroundColor: '#b5fcb8',
                darkBackgroundColor: '#262626',
            },
        },
    ],
};

export const menuRegistry: MenuCategory[] = [
    {
        id: 'smart-layouts',
        label: 'Шаблоны',
        Icon: FaBox,
        elements: [
            {
                elementTypeId: 'smart-layout',
                label: 'Изображения с текстом',
                Icon: FaLayerGroup,
                defaultProps: {
                    type: 'images-with-text',
                    items: [
                        {
                            title: '<p><span class="heading-text heading-3">Заголовок</span></p>',
                            text: '<p>Описание</p>',
                            imageUrl: '',
                            iconUrl: '',
                        },
                        {
                            title: '<p><span class="heading-text heading-3">Заголовок</span></p>',
                            text: '<p>Описание</p>',
                            imageUrl: '',
                            iconUrl: '',
                        },
                        {
                            title: '<p><span class="heading-text heading-3">Заголовок</span></p>',
                            text: '<p>Описание</p>',
                            imageUrl: '',
                            iconUrl: '',
                        },
                    ],
                    layoutType: 'images-with-text',
                    columnSize: 3,
                    align: 'center',
                    imageShape: 'square',
                    imageSize: 5,
                },
            },
            {
                elementTypeId: 'smart-layout',
                label: 'Текстовые блоки',
                Icon: FaLayerGroup,
                defaultProps: {
                    type: 'text-boxes',
                    items: [
                        {
                            title: '<p><span class="heading-text heading-3">Заголовок</span></p>',
                            text: '<p>Описание</p>',
                            imageUrl: '',
                            iconUrl: '',
                        },
                        {
                            title: '<p><span class="heading-text heading-3">Заголовок</span></p>',
                            text: '<p>Описание</p>',
                            imageUrl: '',
                            iconUrl: '',
                        },
                        {
                            title: '<p><span class="heading-text heading-3">Заголовок</span></p>',
                            text: '<p>Описание</p>',
                            imageUrl: '',
                            iconUrl: '',
                        },
                    ],
                    layoutType: 'text-boxes',
                    columnSize: 3,
                    align: 'center',
                    imageShape: 'square',
                    imageSize: 5,
                },
            },
        ],
    },
    {
        id: 'basic',
        label: 'Базовые элементы',
        Icon: FaFont,
        subCategories: [
            {
                id: 'text',
                label: 'Текст',
                elements: [
                    {
                        elementTypeId: 'text',
                        label: 'Текст',
                        Icon: FaFont,
                        defaultProps: { textType: 'text', content: '' },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Заголовок',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 1, content: editorsDefaultContent.title },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Подзаголовок 1',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 2, content: editorsDefaultContent.heading1 },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Подзаголовок 2',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 3, content: editorsDefaultContent.heading2 },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Подзаголовок 3',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 4, content: editorsDefaultContent.heading3 },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Подзаголовок 4',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 5, content: editorsDefaultContent.heading4 },
                    },
                    {
                        elementTypeId: 'quote',
                        label: 'Цитата',
                        Icon: FaQuoteLeft,
                        defaultProps: { textType: 'quote', content: editorsDefaultContent.quote },
                    },
                ],
            },
            {
                id: 'tables',
                label: 'Таблицы',
                elements: [
                    {
                        elementTypeId: 'table',
                        label: 'Таблица 2x2',
                        Icon: FaTable,
                        defaultProps: {
                            textType: 'table',
                            content: editorsDefaultContent.table2x2,
                            rows: 2,
                            columns: 2,
                            isTable: true,
                        },
                    },
                    {
                        elementTypeId: 'table',
                        label: 'Таблица 3x3',
                        Icon: FaTable,
                        defaultProps: {
                            textType: 'table',
                            content: editorsDefaultContent.table3x3,
                            rows: 3,
                            columns: 3,
                            isTable: true,
                        },
                    },
                    {
                        elementTypeId: 'table',
                        label: 'Таблица 4x4',
                        Icon: FaTable,
                        defaultProps: {
                            textType: 'table',
                            content: editorsDefaultContent.table4x4,
                            rows: 4,
                            columns: 4,
                            isTable: true,
                        },
                    },
                ],
            },
            {
                id: 'lists',
                label: 'Списки',
                elements: [
                    {
                        elementTypeId: 'bullet-list',
                        label: 'Список',
                        Icon: FaList,
                        defaultProps: {
                            content: editorsDefaultContent.lists,
                        },
                    },
                    {
                        elementTypeId: 'numbered-list',
                        label: 'Нумерованный список',
                        Icon: FaList,
                        defaultProps: {
                            content: editorsDefaultContent.numeredList,
                        },
                    },
                    {
                        elementTypeId: 'todo-list',
                        label: 'Список задач',
                        Icon: FaList,
                        defaultProps: {
                            content: editorsDefaultContent.todoList,
                        },
                    },
                ],
            },
            BoxCategories,
            // {
            //     id: 'interactive',
            //     label: 'Интерактивные элементы',
            //     elements: [
            //         {
            //             elementTypeId: 'button',
            //             label: 'Кнопка',
            //             Icon: FaBox,
            //             defaultProps: {
            //                 textType: 'button',
            //                 content: editorsDefaultContent.button,
            //             },
            //         },
            //         {
            //             elementTypeId: 'toggle',
            //             label: 'Переключатель',
            //             Icon: FaToggleOn,
            //             defaultProps: {
            //                 textType: 'details',
            //                 content: editorsDefaultContent.toggle,
            //             },
            //         },
            //     ],
            // },
        ],
    },
    {
        id: 'media',
        label: 'Медиа',
        Icon: FaImage,
        elements: [
            {
                elementTypeId: 'image',
                label: 'Изображение',
                Icon: FaImage,
                defaultProps: {
                    src: '',
                    alt: 'Image',
                    alignment: 'center',
                    width: undefined,
                },
            },
            // {
            //     elementTypeId: 'video',
            //     label: 'Видео',
            //     Icon: FaVideo,
            //     defaultProps: { content: '' },
            // },
        ],
    },
    {
        id: 'charts',
        label: 'Диаграммы',
        Icon: FaRegChartBar,
        elements: [
            {
                elementTypeId: 'chart',
                label: 'Столбчатая диаграмма',
                Icon: FaRegChartBar,
                defaultProps: {
                    chartType: 'bar',
                    data: [
                        { name: 'Q1', value: 220 },
                        { name: 'Q2', value: 458 },
                        { name: 'Q3', value: 359 },
                        { name: 'Q4', value: 500 },
                    ],
                    series: [
                        {
                            key: 'value',
                            label: 'value',
                        },
                    ],
                },
            },
            {
                elementTypeId: 'chart',
                label: 'Линейная диаграмма',
                Icon: FaRegChartBar,
                defaultProps: {
                    chartType: 'line',
                    data: [
                        { name: 'Q1', value: 220 },
                        { name: 'Q2', value: 458 },
                        { name: 'Q3', value: 359 },
                        { name: 'Q4', value: 500 },
                    ],
                    series: [
                        {
                            key: 'value',
                            label: 'value',
                        },
                    ],
                },
            },
            {
                elementTypeId: 'chart',
                label: 'Круговая диаграмма',
                Icon: FaRegChartBar,
                defaultProps: {
                    chartType: 'pie',
                    data: [
                        { name: 'Q1', value: 220 },
                        { name: 'Q2', value: 458 },
                        { name: 'Q3', value: 359 },
                        { name: 'Q4', value: 500 },
                    ],
                    series: [
                        {
                            key: 'value',
                            label: 'value',
                        },
                    ],
                },
            },
            {
                elementTypeId: 'chart',
                label: 'Кольцевая диаграмма',
                Icon: FaRegChartBar,
                defaultProps: {
                    chartType: 'donut',
                    data: [
                        { name: 'Q1', value: 220 },
                        { name: 'Q2', value: 458 },
                        { name: 'Q3', value: 359 },
                        { name: 'Q4', value: 500 },
                    ],
                    series: [
                        {
                            key: 'value',
                            label: 'value',
                        },
                    ],
                },
            },
        ],
    },
];

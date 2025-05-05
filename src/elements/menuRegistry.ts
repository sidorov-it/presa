import {
    FaFont,
    FaTable,
    FaList,
    FaImage,
    FaQuoteLeft,
    FaRegAddressCard,
    FaHeading,
    FaListOl,
    FaChartBar,
    FaChartPie,
    FaBox,
} from 'react-icons/fa';
import { FaRegChartBar } from 'react-icons/fa6';

import editorsDefaultContent from './textEditor/defaultContent';
import { PiTextColumns } from 'react-icons/pi';
import { LuHeading1, LuHeading2, LuHeading3, LuHeading4 } from 'react-icons/lu';
import { FaListCheck } from 'react-icons/fa6';
import { BoxIconOptions } from '@/components/editor/Menus/BubbleMenus/BoxBubbleMenu/BoxIconOptions';
import { TbChartDonutFilled } from 'react-icons/tb';
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
    elementVariant?: string;
}

export const BoxCategories = {
    id: 'boxes',
    label: 'Блоки',
    elements: [
        {
            elementTypeId: 'box',
            label: 'Примечание',
            Icon: BoxIconOptions.find(option => option.id === 'note-box')?.Icon,
            elementVariant: 'note-box',
            defaultProps: {
                iconType: 'note-box',
                content: editorsDefaultContent.box,
                backgroundColor: '#bbb8fa',
                darkBackgroundColor: '#01004d',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Информация',
            Icon: BoxIconOptions.find(option => option.id === 'info-box')?.Icon,
            elementVariant: 'info-box',
            defaultProps: {
                iconType: 'info-box',
                content: editorsDefaultContent.infoBox,
                backgroundColor: '#b6d6fc',
                darkBackgroundColor: '#032349',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Предупреждение',
            Icon: BoxIconOptions.find(option => option.id === 'warning-box')?.Icon,
            elementVariant: 'warning-box',
            defaultProps: {
                iconType: 'warning-box',
                content: editorsDefaultContent.warningBox,
                backgroundColor: '#fcf2b5',
                darkBackgroundColor: '#032349',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Предостережение',
            Icon: BoxIconOptions.find(option => option.id === 'caution-box')?.Icon,
            elementVariant: 'caution-box',
            defaultProps: {
                iconType: 'caution-box',
                content: editorsDefaultContent.cautionBox,
                backgroundColor: '#ffb3b3',
                darkBackgroundColor: '#4a3f03',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Успех',
            Icon: BoxIconOptions.find(option => option.id === 'success-box')?.Icon,
            elementVariant: 'success-box',
            defaultProps: {
                iconType: 'success-box',
                content: editorsDefaultContent.successBox,
                backgroundColor: '#b5fcb8',
                darkBackgroundColor: '#183a13',
            },
        },
        {
            elementTypeId: 'box',
            label: 'Вопрос',
            Icon: BoxIconOptions.find(option => option.id === 'question-box')?.Icon,
            elementVariant: 'question-box',
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
        label: 'Структурные блоки',
        Icon: FaBox,
        elements: [
            {
                elementTypeId: 'smart-layout',
                label: 'Изображения с текстом',
                Icon: FaRegAddressCard,
                elementVariant: 'images-with-text',
                defaultProps: {
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
                    columnSize: 3,
                    align: 'center',
                    imageShape: 'square',
                    imageSize: 5,
                },
            },
            {
                elementTypeId: 'smart-layout',
                label: 'Текстовые блоки',
                Icon: PiTextColumns,
                elementVariant: 'text-boxes',
                defaultProps: {
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
                        elementVariant: 'text',
                        defaultProps: { textType: 'text', content: '' },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Заголовок',
                        Icon: FaHeading,
                        elementVariant: 'heading',
                        defaultProps: { textType: 'heading', level: 1, content: editorsDefaultContent.title },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Подзаголовок 1',
                        Icon: LuHeading1,
                        elementVariant: 'heading1',
                        defaultProps: { textType: 'heading', level: 2, content: editorsDefaultContent.heading1 },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Подзаголовок 2',
                        Icon: LuHeading2,
                        elementVariant: 'heading2',
                        defaultProps: { textType: 'heading', level: 3, content: editorsDefaultContent.heading2 },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Подзаголовок 3',
                        Icon: LuHeading3,
                        elementVariant: 'heading3',
                        defaultProps: { textType: 'heading', level: 4, content: editorsDefaultContent.heading3 },
                    },
                    {
                        elementTypeId: 'heading',
                        label: 'Подзаголовок 4',
                        Icon: LuHeading4,
                        elementVariant: 'heading4',
                        defaultProps: { textType: 'heading', level: 5, content: editorsDefaultContent.heading4 },
                    },
                    {
                        elementTypeId: 'quote',
                        label: 'Цитата',
                        Icon: FaQuoteLeft,
                        elementVariant: 'quote',
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
                        elementVariant: 'table2x2',
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
                        elementVariant: 'table3x3',
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
                        elementVariant: 'table4x4',
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
                        Icon: FaListOl,
                        defaultProps: {
                            content: editorsDefaultContent.numeredList,
                        },
                    },
                    {
                        elementTypeId: 'todo-list',
                        label: 'Список задач',
                        Icon: FaListCheck,
                        defaultProps: {
                            content: editorsDefaultContent.todoList,
                        },
                    },
                ],
            },
            BoxCategories,
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
        Icon: FaChartBar,
        elements: [
            {
                elementTypeId: 'chart',
                label: 'Столбчатая диаграмма',
                Icon: FaChartBar,
                elementVariant: 'bar',
                defaultProps: {
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
                elementVariant: 'line',
                defaultProps: {
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
                Icon: FaChartPie,
                elementVariant: 'pie',
                defaultProps: {
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
                Icon: TbChartDonutFilled,
                elementVariant: 'donut',
                defaultProps: {
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

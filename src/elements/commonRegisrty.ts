import { FaFont, FaTable, FaList, FaImage, FaQuoteLeft, FaRegAddressCard, FaHeading, FaListOl } from 'react-icons/fa';
import { FaRegChartBar, FaListCheck } from 'react-icons/fa6';
import { LuChartBar, LuChartColumn, LuChartPie, LuHeading1, LuHeading2, LuHeading3, LuHeading4 } from 'react-icons/lu';
import { TbChartDonutFilled } from 'react-icons/tb';
import { IconType } from 'react-icons';

import { ElementType } from '@/types/elements';
import { TextType } from '@/types';
import { BoxIconOptions } from '@/components/editor/Menus/BubbleMenus/BoxBubbleMenu/BoxIconOptions';
import { MenuElementType, ImageElement, EditorElement, TipTapRefs, SmartLayoutElement, BaseElement } from '@/types';

import { BubbleMenus } from '@/components/editor/Menus/menusComponents';
import { MutableRefObject } from 'react';
import {
    HEADING_1_LEVEL,
    HEADING_2_LEVEL,
    HEADING_3_LEVEL,
    HEADING_4_LEVEL,
    HEADING_5_LEVEL,
    NORMAL_TEXT_LEVEL,
} from '@/constants/consts';

interface ElementRegistryElement {
    elementTypeId: ElementType;
    MenuComponent?: React.ComponentType<any>;
    Icon?: IconType;
    label: string;
    elementVariant?: string;
    props: Record<string, any>;
    hasTextEditor?: boolean;
    customMenuType?: MenuElementType;
    llmHints?: {
        purpose: string;
        contextRules: string[];
    };
    slots?: Array<{
        slot: string;
        llmHint: string;
        type: string;
    }>;
    isArray?: boolean;
    itemFields?: Array<{ field: string; llmHint: string; type: string }>;
}

export const ElementRegistry: Record<string, ElementRegistryElement> = {
    SmartLayoutImagesWithText: {
        elementTypeId: ElementType.SMART_LAYOUT,
        // MenuComponent: SmartLayoutSettings,
        Icon: FaRegAddressCard,
        label: 'Изображения с текстом',
        elementVariant: 'images-with-text',
        props: {
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
        isArray: true,
        itemFields: [
            { field: 'title', llmHint: 'Заголовок элемента', type: 'text' },
            { field: 'text', llmHint: 'Описание элемента', type: 'text' },
            { field: 'imageUrl', llmHint: 'Ссылка на изображение элемента', type: 'image' },
            { field: 'iconUrl', llmHint: 'Ссылка на иконку элемента', type: 'image' },
        ],
        // slots: [
        //     {
        //         slot: 'title1',
        //         llmHint: 'Заголовок первого элемента',
        //     },
        //     {
        //         slot: 'text1',
        //         llmHint: 'Описание первого элемента',
        //     },
        //     {
        //         slot: 'imageUrl1',
        //         llmHint: 'Ссылка на изображение первого элемента',
        //     },
        //     {
        //         slot: 'iconUrl1',
        //         llmHint: 'Ссылка на иконку первого элемента',
        //     },
        //     {
        //         slot: 'title2',
        //         llmHint: 'Заголовок второго элемента',
        //     },
        //     {
        //         slot: 'text2',
        //         llmHint: 'Описание второго элемента',
        //     },
        //     {
        //         slot: 'imageUrl2',
        //         llmHint: 'Ссылка на изображение второго элемента',
        //     },
        //     {
        //         slot: 'iconUrl2',
        //         llmHint: 'Ссылка на иконку второго элемента',
        //     },
        //     {
        //         slot: 'title3',
        //         llmHint: 'Заголовок третьего элемента',
        //     },
        // ],
        llmHints: {
            purpose:
                'Текстовые блоки с большими изображениями. В каждом блоке должен быть заголовок, описание и изображение.',
            contextRules: [
                'Заголовок должен быть понятным и информативным',
                'Описание должно быть понятным и информативным',
                'Изображение должно быть напрямую связано с текстом',
            ],
        },
    },
    SmartLayoutTextBlocks: {
        elementTypeId: ElementType.SMART_LAYOUT,
        // MenuComponent: SmartLayoutSettings,
        Icon: FaRegAddressCard,
        label: 'Текстовые блоки',
        elementVariant: 'text-boxes',
        props: {
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
        slots: [
            {
                slot: 'title1',
                llmHint: 'Заголовок первого элемента',
                type: 'text',
            },
            {
                slot: 'text1',
                llmHint: 'Описание первого элемента',
                type: 'text',
            },
            {
                slot: 'imageUrl1',
                llmHint: 'Ссылка на изображение первого элемента',
                type: 'image',
            },
            {
                slot: 'iconUrl1',
                llmHint: 'Ссылка на иконку первого элемента',
                type: 'image',
            },
            {
                slot: 'title2',
                llmHint: 'Заголовок второго элемента',
                type: 'text',
            },
            {
                slot: 'text2',
                llmHint: 'Описание второго элемента',
                type: 'text',
            },
            {
                slot: 'imageUrl2',
                llmHint: 'Ссылка на изображение второго элемента',
                type: 'image',
            },
            {
                slot: 'iconUrl2',
                llmHint: 'Ссылка на иконку второго элемента',
                type: 'image',
            },
            {
                slot: 'title3',
                llmHint: 'Заголовок третьего элемента',
                type: 'text',
            },
        ],
        llmHints: {
            purpose: 'Текстовые блоки с изображениями. В каждом блоке должен быть заголовок, описание и изображение',
            contextRules: [
                'Заголовок должен быть понятным и информативным',
                'Описание должно быть понятным и информативным',
                'Изображение должно быть напрямую связано с текстом',
            ],
        },
    },
    SmartLayoutSteps: {
        elementTypeId: ElementType.SMART_LAYOUT,
        Icon: FaListOl,
        label: 'Шаги',
        elementVariant: 'steps',
        props: {
            items: [
                {
                    title: '<p><span class="heading-text heading-3">Шаг 1</span></p>',
                    text: '<p>Описание</p>',
                    imageUrl: '',
                    iconUrl: '',
                },
                {
                    title: '<p><span class="heading-text heading-3">Шаг 2</span></p>',
                    text: '<p>Описание</p>',
                    imageUrl: '',
                    iconUrl: '',
                },
                {
                    title: '<p><span class="heading-text heading-3">Шаг 3</span></p>',
                    text: '<p>Описание</p>',
                    imageUrl: '',
                    iconUrl: '',
                },
            ],
            columnSize: 3,
            align: 'left',
            imageShape: 'square',
            imageSize: 5,
            direction: 'horizontal',
        },
        isArray: true,
    },
    SmartLayoutTimeline: {
        elementTypeId: ElementType.SMART_LAYOUT,
        Icon: FaRegChartBar,
        label: 'Хронология',
        elementVariant: 'timeline',
        props: {
            items: [
                {
                    title: '<p><span class="heading-text heading-3">Событие 1</span></p>',
                    text: '<p>Описание</p>',
                    imageUrl: '',
                    iconUrl: '',
                },
                {
                    title: '<p><span class="heading-text heading-3">Событие 2</span></p>',
                    text: '<p>Описание</p>',
                    imageUrl: '',
                    iconUrl: '',
                },
                {
                    title: '<p><span class="heading-text heading-3">Событие 3</span></p>',
                    text: '<p>Описание</p>',
                    imageUrl: '',
                    iconUrl: '',
                },
            ],
            columnSize: 3,
            align: 'left',
            imageShape: 'square',
            imageSize: 5,
            direction: 'horizontal',
        },
        isArray: true,
    },
    Text: {
        elementTypeId: ElementType.TEXT,
        hasTextEditor: true,
        Icon: FaFont,
        label: 'Текст',
        elementVariant: 'text',
        props: {
            textType: 'text',
            level: NORMAL_TEXT_LEVEL,
            content: '<span class="body-text normal-text"></span>',
        },
        slots: [{ slot: 'content', llmHint: 'Текстовый контент', type: 'text' }],
        llmHints: {
            purpose: 'Текстовый элемент',
            contextRules: ['Текст должен быть понятным и информативным'],
        },
    },
    Heading: {
        elementTypeId: ElementType.TEXT,
        hasTextEditor: true,
        Icon: FaHeading,
        label: 'Заголовок',
        elementVariant: 'heading',
        props: {
            textType: 'heading',
            level: HEADING_1_LEVEL,
            content: '<span class="heading-text title-text">Заголовок</span>',
        },
        slots: [{ slot: 'content', llmHint: 'Текст заголовка', type: 'text' }],
        llmHints: {
            purpose: 'Заголовок',
            contextRules: ['Заголовок должен быть понятным и информативным'],
        },
    },
    Heading1: {
        elementTypeId: ElementType.TEXT,
        hasTextEditor: true,
        Icon: LuHeading1,
        label: 'Подзаголовок 1',
        elementVariant: 'heading1',
        props: {
            textType: 'heading',
            level: HEADING_2_LEVEL,
            content: '<span class="heading-text heading-1">Подзаголовок 1</span>',
        },
        slots: [{ slot: 'content', llmHint: 'Текст заголовка', type: 'text' }],
        llmHints: {
            purpose: 'Заголовок',
            contextRules: ['Заголовок должен быть понятным и информативным'],
        },
    },
    Heading2: {
        elementTypeId: ElementType.TEXT,
        hasTextEditor: true,
        Icon: LuHeading2,
        label: 'Подзаголовок 2',
        elementVariant: 'heading2',
        props: {
            textType: 'heading',
            level: HEADING_3_LEVEL,
            content: '<span class="heading-text heading-2">Подзаголовок 2</span>',
        },
        slots: [{ slot: 'content', llmHint: 'Текст заголовка', type: 'text' }],
        llmHints: {
            purpose: 'Заголовок',
            contextRules: ['Заголовок должен быть понятным и информативным'],
        },
    },
    Heading3: {
        elementTypeId: ElementType.TEXT,
        hasTextEditor: true,
        Icon: LuHeading3,
        label: 'Подзаголовок 3',
        elementVariant: 'heading3',
        props: {
            textType: 'heading',
            level: HEADING_4_LEVEL,
            content: '<span class="heading-text heading-3">Подзаголовок 3</span>',
        },
        slots: [{ slot: 'content', llmHint: 'Текст заголовка', type: 'text' }],
        llmHints: {
            purpose: 'Заголовок',
            contextRules: ['Заголовок должен быть понятным и информативным'],
        },
    },
    Heading4: {
        elementTypeId: ElementType.TEXT,
        hasTextEditor: true,
        Icon: LuHeading4,
        label: 'Подзаголовок 4',
        elementVariant: 'heading4',
        props: {
            textType: 'heading',
            level: HEADING_5_LEVEL,
            content: '<span class="heading-text heading-4">Подзаголовок 4</span>',
        },
        slots: [{ slot: 'content', llmHint: 'Текст заголовка', type: 'text' }],
        llmHints: {
            purpose: 'Заголовок',
            contextRules: ['Заголовок должен быть понятным и информативным'],
        },
    },
    Quote: {
        elementTypeId: ElementType.QUOTE,
        hasTextEditor: true,
        Icon: FaQuoteLeft,
        label: 'Цитата',
        MenuComponent: BubbleMenus['quote-bubble'],
        elementVariant: 'quote',
        props: {
            textType: 'quote',
            content: '<blockquote>Цитата</blockquote>',
        },
        slots: [{ slot: 'content', llmHint: 'Текст цитаты', type: 'text' }],
        llmHints: {
            purpose: 'Цитата',
            contextRules: ['Цитата должна быть понятной и информативной'],
        },
    },
    Table2x2: {
        elementTypeId: ElementType.TABLE,
        MenuComponent: BubbleMenus['table-bubble'],
        Icon: FaTable,
        label: 'Таблица 2x2',
        elementVariant: 'table2x2',
        props: {
            textType: 'table',
            content:
                '\n<table>\n    <tbody>\n        <tr>\n            <td><p>Ячейка 1</p></td>\n            <td><p>Ячейка 2</p></td>\n        </tr>\n        <tr>\n            <td><p>Ячейка 3</p></td>\n            <td><p>Ячейка 4</p></td>\n        </tr>\n    </tbody>\n</table>',
            rows: 2,
            columns: 2,
            isTable: true,
        },
        slots: [
            {
                slot: 'cell0x0',
                llmHint: '1 ячейка в 1 строке',
                type: 'text',
            },
            {
                slot: 'cell0x1',
                llmHint: '2 ячейка в 1 строке',
                type: 'text',
            },
            {
                slot: 'cell1x0',
                llmHint: '1 ячейка в 2 строке',
                type: 'text',
            },
            {
                slot: 'cell1x1',
                llmHint: '2 ячейка в 2 строке',
                type: 'text',
            },
        ],
        llmHints: {
            purpose: 'Таблица',
            contextRules: ['Таблица должна быть понятной и информативной'],
        },
    },
    Table3x3: {
        elementTypeId: ElementType.TABLE,
        Icon: FaTable,
        MenuComponent: BubbleMenus['table-bubble'],
        label: 'Таблица 3x3',
        elementVariant: 'table3x3',
        props: {
            textType: 'table',
            content:
                '\n<table>\n    <tbody>\n        <tr>\n            <td><p>Ячейка 1</p></td>\n            <td><p>Ячейка 2</p></td>\n            <td><p>Ячейка 3</p></td>\n        </tr>\n        <tr>\n            <td><p>Ячейка 4</p></td>\n            <td><p>Ячейка 5</p></td>\n            <td><p>Ячейка 6</p></td>\n        </tr>\n        <tr>\n            <td><p>Ячейка 7</p></td>\n            <td><p>Ячейка 8</p></td>\n            <td><p>Ячейка 9</p></td>\n        </tr>\n    </tbody>\n</table>',
            rows: 3,
            columns: 3,
            isTable: true,
        },
        slots: [
            {
                slot: 'cell0x0',
                llmHint: '1 ячейка в 1 строке',
                type: 'text',
            },
            {
                slot: 'cell0x1',
                llmHint: '2 ячейка в 1 строке',
                type: 'text',
            },
            {
                slot: 'cell0x2',
                llmHint: '3 ячейка в 1 строке',
                type: 'text',
            },
            {
                slot: 'cell1x0',
                llmHint: '1 ячейка в 2 строке',
                type: 'text',
            },
            {
                slot: 'cell1x1',
                llmHint: '2 ячейка в 2 строке',
                type: 'text',
            },
            {
                slot: 'cell1x2',
                llmHint: '3 ячейка в 2 строке',
                type: 'text',
            },
            {
                slot: 'cell2x0',
                llmHint: '1 ячейка в 3 строке',
                type: 'text',
            },
            {
                slot: 'cell2x1',
                llmHint: '2 ячейка в 3 строке',
                type: 'text',
            },
            {
                slot: 'cell2x2',
                llmHint: '3 ячейка в 3 строке',
                type: 'text',
            },
        ],
        llmHints: {
            purpose: 'Таблица',
            contextRules: ['Таблица должна быть понятной и информативной'],
        },
    },
    Table4x4: {
        elementTypeId: ElementType.TABLE,
        Icon: FaTable,
        MenuComponent: BubbleMenus['table-bubble'],

        label: 'Таблица 4x4',
        elementVariant: 'table4x4',
        props: {
            textType: 'table',
            content:
                '\n<table>\n    <tbody>\n        <tr>\n            <td><p>Ячейка 1</p></td>\n            <td><p>Ячейка 2</p></td>\n            <td><p>Ячейка 3</p></td>\n            <td><p>Ячейка 4</p></td>\n        </tr>\n        <tr>\n            <td><p>Ячейка 5</p></td>\n            <td><p>Ячейка 6</p></td>\n            <td><p>Ячейка 7</p></td>\n            <td><p>Ячейка 8</p></td>\n        </tr>\n        <tr>\n            <td><p>Ячейка 9</p></td>\n            <td><p>Ячейка 10</p></td>\n            <td><p>Ячейка 11</p></td>\n            <td><p>Ячейка 12</p></td>\n        </tr>\n        <tr>\n            <td><p>Ячейка 13</p></td>\n            <td><p>Ячейка 14</p></td>\n            <td><p>Ячейка 15</p></td>\n            <td><p>Ячейка 16</p></td>\n        </tr>\n    </tbody>\n</table>',
            rows: 4,
            columns: 4,
            isTable: true,
        },
        slots: [
            {
                slot: 'cell0x0',
                llmHint: '1 ячейка в 1 строке',
                type: 'text',
            },
            {
                slot: 'cell0x1',
                llmHint: '2 ячейка в 1 строке',
                type: 'text',
            },
            {
                slot: 'cell0x2',
                llmHint: '3 ячейка в 1 строке',
                type: 'text',
            },
            {
                slot: 'cell0x3',
                llmHint: '4 ячейка в 1 строке',
                type: 'text',
            },
            {
                slot: 'cell1x0',
                llmHint: '1 ячейка в 2 строке',
                type: 'text',
            },
            {
                slot: 'cell1x1',
                llmHint: '2 ячейка в 2 строке',
                type: 'text',
            },
            {
                slot: 'cell1x2',
                llmHint: '3 ячейка в 2 строке',
                type: 'text',
            },
            {
                slot: 'cell1x3',
                llmHint: '4 ячейка в 2 строке',
                type: 'text',
            },
            {
                slot: 'cell2x0',
                llmHint: '1 ячейка в 3 строке',
                type: 'text',
            },
            {
                slot: 'cell2x1',
                llmHint: '2 ячейка в 3 строке',
                type: 'text',
            },
            {
                slot: 'cell2x2',
                llmHint: '3 ячейка в 3 строке',
                type: 'text',
            },
            {
                slot: 'cell2x3',
                llmHint: '4 ячейка в 3 строке',
                type: 'text',
            },
            {
                slot: 'cell3x0',
                llmHint: '1 ячейка в 4 строке',
                type: 'text',
            },
            {
                slot: 'cell3x1',
                llmHint: '2 ячейка в 4 строке',
                type: 'text',
            },
            {
                slot: 'cell3x2',
                llmHint: '3 ячейка в 4 строке',
                type: 'text',
            },
            {
                slot: 'cell3x3',
                llmHint: '4 ячейка в 4 строке',
                type: 'text',
            },
        ],
        llmHints: {
            purpose: 'Таблица',
            contextRules: ['Таблица должна быть понятной и информативной'],
        },
    },
    BulletList: {
        elementTypeId: ElementType.TEXT,
        hasTextEditor: true,
        Icon: FaList,
        label: 'Список',
        elementVariant: 'bullet-list',
        props: {
            textType: TextType.BULLET_LIST,
            content: ['Элемент списка', 'Еще один элемент списка'],
        },
        slots: [{ slot: 'content', llmHint: 'Текст списка', type: 'text' }],
        llmHints: {
            purpose: 'Список с точками',
            contextRules: ['Список должен быть понятным и информативным'],
        },
    },
    NumberedList: {
        elementTypeId: ElementType.TEXT,
        hasTextEditor: true,
        Icon: FaListOl,
        label: 'Нумерованный список',
        elementVariant: 'numbered-list',
        props: {
            textType: TextType.NUMERED_LIST,
            content: ['Первый элемент списка', 'Второй элемент списка'],
        },
        slots: [{ slot: 'content', llmHint: 'Текст списка', type: 'text' }],
        llmHints: {
            purpose: 'Нумерованный список',
            contextRules: ['Нумерованный список должен быть понятным и информативным'],
        },
    },
    TaskList: {
        elementTypeId: ElementType.TEXT,
        hasTextEditor: true,
        Icon: FaListCheck,
        label: 'Список задач',
        elementVariant: 'todo-list',
        props: {
            textType: TextType.TODO_LIST,
            content: ['Первый элемент списка', 'Второй элемент списка'],
        },
        slots: [{ slot: 'content', llmHint: 'Текст списка', type: 'text' }],
        llmHints: {
            purpose: 'Список задач',
            contextRules: ['Список задач должен быть понятным и информативным'],
        },
    },
    NoteBox: {
        elementTypeId: ElementType.BOX,
        MenuComponent: BubbleMenus['box-bubble'],
        label: 'Примечание',
        Icon: BoxIconOptions.find(option => option.id === 'note-box')?.Icon,
        elementVariant: 'note-box',
        props: {
            iconType: 'note-box',
            content: '<p>Простой блок текста</p>',
            backgroundColor: '#bbb8fa',
            darkBackgroundColor: '#01004d',
        },
        slots: [{ slot: 'content', llmHint: 'Текстовый блок - примечание', type: 'text' }],
        llmHints: {
            purpose: 'Блок текста',
            contextRules: ['Блок текста должен быть понятным и информативным'],
        },
    },
    InfoBox: {
        elementTypeId: ElementType.BOX,
        MenuComponent: BubbleMenus['box-bubble'],
        label: 'Информация',
        Icon: BoxIconOptions.find(option => option.id === 'info-box')?.Icon,
        elementVariant: 'info-box',
        props: {
            iconType: 'info-box',
            content: '<p>Полезная информация</p>',
            backgroundColor: '#b6d6fc',
            darkBackgroundColor: '#032349',
        },
        slots: [{ slot: 'content', llmHint: 'Текстовый блок - информация', type: 'text' }],
        llmHints: {
            purpose: 'Блок текста',
            contextRules: ['Блок текста должен быть понятным и информативным'],
        },
    },
    WarningBox: {
        elementTypeId: ElementType.BOX,
        MenuComponent: BubbleMenus['box-bubble'],
        label: 'Предупреждение',
        Icon: BoxIconOptions.find(option => option.id === 'warning-box')?.Icon,
        elementVariant: 'warning-box',
        props: {
            iconType: 'warning-box',
            content: '<p>Предупреждение</p>',
            backgroundColor: '#fcf2b5',
            darkBackgroundColor: '#032349',
        },
        slots: [{ slot: 'content', llmHint: 'Текстовый блок - предупреждение', type: 'text' }],
        llmHints: {
            purpose: 'Блок текста',
            contextRules: ['Блок текста должен быть понятным и информативным'],
        },
    },
    CautionBox: {
        elementTypeId: ElementType.BOX,
        MenuComponent: BubbleMenus['box-bubble'],
        label: 'Предостережение',
        Icon: BoxIconOptions.find(option => option.id === 'caution-box')?.Icon,
        elementVariant: 'caution-box',
        props: {
            iconType: 'caution-box',
            content: '<p>Внимание!</p>',
            backgroundColor: '#ffb3b3',
            darkBackgroundColor: '#4a3f03',
        },
        slots: [{ slot: 'content', llmHint: 'Текстовый блок - предостережение', type: 'text' }],
        llmHints: {
            purpose: 'Блок текста',
            contextRules: ['Блок текста должен быть понятным и информативным'],
        },
    },
    SuccessBox: {
        elementTypeId: ElementType.BOX,
        MenuComponent: BubbleMenus['box-bubble'],
        label: 'Успех',
        Icon: BoxIconOptions.find(option => option.id === 'success-box')?.Icon,
        elementVariant: 'success-box',
        props: {
            iconType: 'success-box',
            content: '<p>Успешно выполнено</p>',
            backgroundColor: '#b5fcb8',
            darkBackgroundColor: '#183a13',
        },
        slots: [{ slot: 'content', llmHint: 'Текстовый блок - успех', type: 'text' }],
        llmHints: {
            purpose: 'Блок текста',
            contextRules: ['Блок текста должен быть понятным и информативным'],
        },
    },
    QuestionBox: {
        elementTypeId: ElementType.BOX,
        MenuComponent: BubbleMenus['box-bubble'],
        label: 'Вопрос',
        Icon: BoxIconOptions.find(option => option.id === 'question-box')?.Icon,
        elementVariant: 'question-box',
        props: {
            iconType: 'question-box',
            content: '<p>Частый вопрос</p>',
            backgroundColor: '#b5fcb8',
            darkBackgroundColor: '#262626',
        },
        slots: [{ slot: 'content', llmHint: 'Текст блока', type: 'text' }],
        llmHints: {
            purpose: 'Блок текста',
            contextRules: ['Блок текста должен быть понятным и информативным'],
        },
    },
    Image: {
        elementTypeId: ElementType.IMAGE,
        label: 'Изображение',
        MenuComponent: BubbleMenus['image-bubble'],
        Icon: FaImage,
        props: {
            src: '',
            alt: 'Image',
            alignment: 'center',
        },
        slots: [{ slot: 'main_image', llmHint: 'Изображение', type: 'image' }],
        llmHints: {
            purpose: 'Изображение',
            contextRules: ['Изображение должно быть напрямую связано с текстом'],
        },
    },
    BarChart: {
        elementTypeId: ElementType.CHART,
        // MenuComponent: ChartSettings,
        customMenuType: 'chart',
        label: 'Столбчатая диаграмма',
        elementVariant: 'bar',
        Icon: LuChartColumn,
        props: {
            data: [
                {
                    name: 'Q1',
                    value: 220,
                },
                {
                    name: 'Q2',
                    value: 458,
                },
                {
                    name: 'Q3',
                    value: 359,
                },
                {
                    name: 'Q4',
                    value: 500,
                },
            ],
            series: [
                {
                    key: 'value',
                    label: 'value',
                },
            ],
        },
        llmHints: {
            purpose: 'Столбчатая диаграмма',
            contextRules: ['Столбчатая диаграмма должна быть понятной и информативной'],
        },
    },
    LineChart: {
        elementTypeId: ElementType.CHART,
        // MenuComponent: ChartSettings,
        customMenuType: 'chart',
        label: 'Линейная диаграмма',
        elementVariant: 'line',
        Icon: LuChartBar,
        props: {
            data: [
                {
                    name: 'Q1',
                    value: 220,
                },
                {
                    name: 'Q2',
                    value: 458,
                },
                {
                    name: 'Q3',
                    value: 359,
                },
                {
                    name: 'Q4',
                    value: 500,
                },
            ],
            series: [
                {
                    key: 'value',
                    label: 'value',
                },
            ],
        },
        llmHints: {
            purpose: 'Линейная диаграмма',
            contextRules: ['Линейная диаграмма должна быть понятной и информативной'],
        },
    },
    PieChart: {
        elementTypeId: ElementType.CHART,
        // MenuComponent: ChartSettings,
        customMenuType: 'chart',
        label: 'Круговая диаграмма',
        elementVariant: 'pie',
        Icon: LuChartPie,
        props: {
            data: [
                {
                    name: 'Q1',
                    value: 220,
                },
                {
                    name: 'Q2',
                    value: 458,
                },
                {
                    name: 'Q3',
                    value: 359,
                },
                {
                    name: 'Q4',
                    value: 500,
                },
            ],
            series: [
                {
                    key: 'value',
                    label: 'value',
                },
            ],
        },
        llmHints: {
            purpose: 'Круговая диаграмма',
            contextRules: ['Круговая диаграмма должна быть понятной и информативной'],
        },
    },
    DonutChart: {
        elementTypeId: ElementType.CHART,
        // MenuComponent: ChartSettings,
        customMenuType: 'chart',
        label: 'Кольцевая диаграмма',
        elementVariant: 'donut',
        Icon: TbChartDonutFilled,
        props: {
            data: [
                {
                    name: 'Q1',
                    value: 220,
                },
                {
                    name: 'Q2',
                    value: 458,
                },
                {
                    name: 'Q3',
                    value: 359,
                },
                {
                    name: 'Q4',
                    value: 500,
                },
            ],
            series: [
                {
                    key: 'value',
                    label: 'value',
                },
            ],
        },
        llmHints: {
            purpose: 'Кольцевая диаграмма',
            contextRules: ['Кольцевая диаграмма должна быть понятной и информативной'],
        },
    },
};

export const fillSlots = ({
    element,
    content,
    tiptapRefs,
}: {
    element: BaseElement;
    content: Array<{
        elementId: string;
        slotId: string;
        content: string | Record<string, string>[];
    }>;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}) => {
    const elementConfig = getElementConfig(element.elementTypeId);
    if (!elementConfig) return;

    switch (element.elementTypeId) {
        case ElementType.TEXT:
        case ElementType.BOX: {
            const editorRef = tiptapRefs.current.editors[content[0].elementId];
            if (editorRef) {
                editorRef.editor
                    .chain()
                    .focus(null, { scrollIntoView: false })
                    .setContent(content[0].content)
                    .blur()
                    .run();

                const updatedContent = editorRef.editor.getHTML();
                (element as EditorElement).content = updatedContent;
            }
            break;
        }
        case ElementType.IMAGE: {
            (element as ImageElement).src = content[0].content as string;
            (element as ImageElement).uploaded = true;
            break;
        }

        case ElementType.SMART_LAYOUT: {
            (element as unknown as SmartLayoutElement).items = (element as unknown as SmartLayoutElement).items.map(
                (item, index) => {
                    const titleValue = content.find(el => el.slotId === `${index}-title`)?.content;
                    const textValue = content.find(el => el.slotId === `${index}-text`)?.content;

                    const titleEditor = tiptapRefs.current.editors[`title-${element.id}-${item.id}`];
                    const textEditor = tiptapRefs.current.editors[`text-${element.id}-${item.id}`];

                    let updatedTitle = '';
                    let updatedText = '';

                    if (titleEditor) {
                        titleEditor?.editor
                            .chain()
                            .focus(null, { scrollIntoView: false })
                            .setContent(titleValue || '')
                            .blur()
                            .run();

                        updatedTitle = titleEditor.editor.getHTML();
                    }
                    if (textEditor) {
                        textEditor.editor
                            .chain()
                            .focus(null, { scrollIntoView: false })
                            .setContent(textValue || '')
                            .blur()
                            .run();

                        updatedText = textEditor.editor.getHTML();
                    }

                    return {
                        ...item,
                        title: updatedTitle,
                        text: updatedText,
                    };
                }
            );

            break;
        }

        default: {
            return element;
        }
    }

    return element;
};

export const getElementConfig = (elementTypeId: ElementType) => {
    return Object.values(ElementRegistry).find(element => element.elementTypeId === elementTypeId);
};

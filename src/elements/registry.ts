import { generateId } from '@/utils/id'
import { type Category, TextElement, TextElementType } from '@/types'
import { FaFont, FaTable, FaList, FaBox, FaImage, FaVideo, FaRegChartBar, FaUpload, FaLink, FaQrcode, FaQuoteLeft, FaToggleOn } from 'react-icons/fa'
import editorsDefaultContent from './textEditor/defaultContent';

// Define components for the BubbleMenu
import HeadingBubbleMenu from '@/components/editor/BubbleMenus/HeadingBubbleMenu';
import QuoteBubbleMenu from '@/components/editor/BubbleMenus/QuoteBubbleMenu';
import TableBubbleMenu from '@/components/editor/BubbleMenus/TableBubbleMenu';
import ListBubbleMenu from '@/components/editor/BubbleMenus/ListBubbleMenu';
import BoxBubbleMenu from '@/components/editor/BubbleMenus/BoxBubbleMenu';
import ButtonBubbleMenu from '@/components/editor/BubbleMenus/ButtonBubbleMenu';
import DefaultBubbleMenu from '@/components/editor/BubbleMenus/DefaultBubbleMenu';

export const getNewElement = (type: string): Omit<TextElement, 'cellId'> => {
    // Find the element configuration in the registry
    const elementConfig = elementsRegistry
        .flatMap(category =>
            category.subCategories
                ? category.subCategories.flatMap(sub => sub.elements)
                : category.elements
        )
        .find(element => element?.id === type);

    // Base properties for all elements
    const baseElement = {
        id: generateId(8),
        type: 'editor' as TextElementType, // Cast to TextElementType to fix type error
        textType: type as 'text' | 'heading' | 'paragraph', // Cast to valid textType
        content: elementConfig?.defaultProps?.content ?? '',
        position: { x: 0, y: 0 },
        size: { width: 300, height: 100 }, // Increased default width for better text editing
        style: {},
        zIndex: 1,
    };

    // // Merge with specific properties based on element type
    // if (type.includes('heading')) {
    //     return {
    //         ...baseElement,
    //         textType: 'heading',
    //         level: elementConfig?.defaultProps?.level ?? 1
    //     };
    // }

    // if (type === 'quote') {
    //     return {
    //         ...baseElement,
    //         textType: 'quote'
    //     };
    // }

    // Return default text element for other types
    return baseElement;
}

export const elementsRegistry: Category[] = [
    {
        id: 'basic',
        label: 'Базовые элементы',
        Icon: FaFont,
        subCategories: [
            {
                id: 'text',
                label: 'Текст',
                // Icon: FaFont,
                elements: [
                    {
                        id: 'title',
                        type: 'editor',
                        label: 'Заголовок',
                        Icon: FaFont,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 1, content: editorsDefaultContent.title }
                    },
                    {
                        id: 'heading-1',
                        type: 'editor',
                        label: 'Подзаголовок 1',
                        Icon: FaFont,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 2, content: editorsDefaultContent.heading1 }
                    },
                    {
                        id: 'heading-2',
                        type: 'editor',
                        label: 'Подзаголовок 2',
                        Icon: FaFont,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 3, content: editorsDefaultContent.heading2 }
                    },
                    {
                        id: 'heading-3',
                        type: 'editor',
                        label: 'Подзаголовок 3',
                        Icon: FaFont,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 4, content: editorsDefaultContent.heading3 }
                    },
                    {
                        id: 'heading-4',
                        type: 'editor',
                        label: 'Подзаголовок 4',
                        Icon: FaFont,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 5, content: editorsDefaultContent.heading4 }
                    },
                    {
                        id: 'quote',
                        type: 'editor',
                        label: 'Цитата',
                        Icon: FaQuoteLeft,
                        MenuComponent: QuoteBubbleMenu,
                        defaultProps: { textType: 'quote', content: editorsDefaultContent.quote }
                    },
                ]
            },
            {
                id: 'tables',
                label: 'Таблицы',
                elements: [
                    {
                        id: 'table-2x2',
                        type: 'table',
                        label: 'Таблица 2x2',
                        Icon: FaTable,
                        MenuComponent: TableBubbleMenu,
                        defaultProps: {
                            textType: 'table',
                            content: editorsDefaultContent.table2x2,
                        }
                    },
                    {
                        id: 'table-3x3',
                        type: 'table',
                        label: 'Таблица 3x3',
                        Icon: FaTable,
                        MenuComponent: TableBubbleMenu,
                        defaultProps: {
                            textType: 'table',
                            content: editorsDefaultContent.table3x3,
                        }
                    },
                    {
                        id: 'table-4x4',
                        type: 'table',
                        label: 'Таблица 4x4',
                        Icon: FaTable,
                        MenuComponent: TableBubbleMenu,
                        defaultProps: {
                            textType: 'table',
                            content: editorsDefaultContent.table4x4
                        }
                    }
                ]
            },
            {
                id: 'lists',
                label: 'Списки',
                // Icon: FaList,
                elements: [
                    // Bullet list
                    // Numered
                    // Todo
                    {
                        id: 'bullet-list',
                        type: 'editor',
                        label: 'Список',
                        Icon: FaList,
                        MenuComponent: ListBubbleMenu,
                        defaultProps: {
                            content: editorsDefaultContent.lists
                        }
                    },
                    {
                        id: 'numered-list',
                        type: 'editor',
                        label: 'Нумерованный список',
                        Icon: FaList,
                        MenuComponent: ListBubbleMenu,
                        defaultProps: {
                            content: editorsDefaultContent.numeredList
                        }
                    },
                    {
                        id: 'todo-list',
                        type: 'editor',
                        label: 'Список задач',
                        Icon: FaList,
                        MenuComponent: ListBubbleMenu,
                        defaultProps: {
                            content: editorsDefaultContent.todoList
                        }
                    },
                ]
            },
            {
                id: 'boxes',
                label: 'Блоки',
                elements: [
                    {
                        id: 'box',
                        type: 'editor',
                        label: 'Блок',
                        Icon: FaBox,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'box',
                            content: editorsDefaultContent.box
                        }
                    },
                    {
                        id: 'note-box',
                        type: 'editor',
                        label: 'Блок с заметкой',
                        Icon: FaBox,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'note-box',
                            content: editorsDefaultContent.noteBox
                        }
                    },
                    {
                        id: 'info-box',
                        type: 'editor',
                        label: 'Блок с информацией',
                        Icon: FaBox,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'info-box',
                            content: editorsDefaultContent.infoBox
                        }
                    },
                    {
                        id: 'warning-box',
                        type: 'editor',
                        label: 'Блок с предупреждением',
                        Icon: FaBox,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'warning-box',
                            content: editorsDefaultContent.warningBox
                        }
                    },
                    {
                        id: 'caution-box',
                        type: 'editor',
                        label: 'Блок с предостережением',
                        Icon: FaBox,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'caution-box',
                            content: editorsDefaultContent.cautionBox
                        }
                    },
                    {
                        id: 'success-box',
                        type: 'editor',
                        label: 'Блок с успехом',
                        Icon: FaBox,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'success-box',
                            content: editorsDefaultContent.successBox
                        }
                    },
                    {
                        id: 'question-box',
                        type: 'editor',
                        label: 'Блок с вопросом',
                        Icon: FaBox,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'question-box',
                            content: editorsDefaultContent.questionBox
                        }
                    }
                ]
            },
            {
                id: 'interactive',
                label: 'Интерактивные элементы',
                elements: [
                    {
                        id: 'button',
                        type: 'editor',
                        label: 'Кнопка',
                        Icon: FaBox,
                        MenuComponent: ButtonBubbleMenu,
                        defaultProps: {
                            textType: 'button',
                            content: editorsDefaultContent.button
                        }
                    },
                    {
                        id: 'toggle',
                        type: 'editor',
                        label: 'Переключатель',
                        Icon: FaToggleOn,
                        MenuComponent: DefaultBubbleMenu,
                        defaultProps: {
                            textType: 'details',
                            content: editorsDefaultContent.toggle
                        }
                    }
                ]
            },
            // ... остальные подкатегории
        ]
    },
    {
        id: 'image',
        label: 'Изображения',
        Icon: FaImage,
        elements: [
            // Upload
            {
                id: 'upload',
                type: 'element',
                label: 'Загрузка изображения',
                Icon: FaUpload,
                MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' }
            },
            // Link
            {
                id: 'link',
                type: 'element',
                label: 'Ссылка',
                Icon: FaLink,
                MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' }
            },
            // QR
            {
                id: 'qr',
                type: 'element',
                label: 'QR-код',
                Icon: FaQrcode,
                MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' }
            },
        ]
    },
    {
        id: 'video',
        label: 'Видео',
        Icon: FaVideo,
        elements: [
            {
                id: 'video',
                type: 'element',
                label: 'Видео',
                Icon: FaVideo,
                MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' }
            }
        ]
    },
    {
        id: 'charts',
        label: 'Диаграммы',
        Icon: FaRegChartBar,
        elements: [
            // Column chart
            {
                id: 'column-chart',
                type: 'element',
                label: 'Столбчатая диаграмма',
                Icon: FaRegChartBar,
                MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' }
            },
            // Bar chart
            {
                id: 'bar-chart',
                type: 'element',
                label: 'Столбчатая диаграмма',
                Icon: FaRegChartBar,
                MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' }
            },
            // Line chart
            {
                id: 'line-chart',
                type: 'element',
                label: 'Линейная диаграмма',
                Icon: FaRegChartBar,
                MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' }
            },
            // Pie chart
            {
                id: 'pie-chart',
                type: 'element',
                label: 'Круговая диаграмма',
                Icon: FaRegChartBar,
                MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' }
            },
            // Donut  chart
            {
                id: 'donut-chart',
                type: 'element',
                label: 'Кольцевая диаграмма',
                Icon: FaRegChartBar,
                MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' }
            },
        ]
    }

]


export const getElementMenuComponent = (type: string): React.ComponentType<any> | undefined => {
    const elementConfig = elementsRegistry
        .flatMap(category =>
            category.subCategories
                ? category.subCategories.flatMap(sub => sub.elements)
                : category.elements
        )
        .find(element => element?.type === type);

    return elementConfig?.MenuComponent;
}
// export const getElementConfig = (type: string): ElementConfig | undefined => {
//   return elementRegistry.find(element => element.type === type)
// }

// export const getElementsByCategory = (category: string): ElementConfig[] => {
//   return elementRegistry.filter(element => element.category === category)
// }
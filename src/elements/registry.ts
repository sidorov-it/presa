import { generateId } from '@/utils/id'
import { type Category, TextElement } from '../types'
import { FaFont, FaTable, FaList, FaBox, FaImage, FaVideo, FaRegChartBar, FaUpload, FaLink, FaQrcode, FaQuoteLeft, FaToggleOn, FaToggleOff } from 'react-icons/fa'

// export const getNewElement = (type: string): Omit<TextElement, 'cellId'> => {
//     const editor = {
//         id: generateId(8),
//         type: 'editor',
//         textType: 'text',
//         content: '',
//         position: { x: 0, y: 0 },
//         size: { width: 100, height: 100 },
//         style: {},
//         zIndex: 1,
//     }

//     return editor;
// }


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
        type: 'editor',
        textType: type,
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
                        type: 'element',
                        label: 'Заголовок',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 1, content: '<h1>Заголовок</h1>' }
                    },
                    {
                        id: 'heading-1',
                        type: 'element',
                        label: 'Подзаголовок 1',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 2, content: '<h2>Подзаголовок 1</h2>' }
                    },
                    {
                        id: 'heading-2',
                        type: 'element',
                        label: 'Подзаголовок 2',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 3, content: '<h3>Подзаголовок 2</h3>' }
                    },
                    {
                        id: 'heading-3',
                        type: 'element',
                        label: 'Подзаголовок 3',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 4, content: '<h4>Подзаголовок 3</h4>' }
                    },
                    {
                        id: 'heading-4',
                        type: 'element',
                        label: 'Подзаголовок 4',
                        Icon: FaFont,
                        defaultProps: { textType: 'heading', level: 5, content: '<h5>Подзаголовок 4</h5>' }
                    },
                    {
                        id: 'quote',
                        type: 'element',
                        label: 'Цитата',
                        Icon: FaQuoteLeft,
                        defaultProps: { textType: 'quote', content: '<blockquote>Цитата</blockquote>' }
                    },
                ]
            },
            {
                id: 'tables',
                label: 'Таблицы',
                // Icon: FaTable,
                elements: [
                    {
                        id: 'table-2x2',
                        type: 'element',
                        label: 'Таблица 2x2',
                        Icon: FaTable,
                        defaultProps: { rows: 2, cols: 2 }
                    },
                    {
                        id: 'table-3x3',
                        type: 'element',
                        label: 'Таблица 3x3',
                        Icon: FaTable,
                        defaultProps: { rows: 3, cols: 3 }
                    },
                    {
                        id: 'table-4x4',
                        type: 'element',
                        label: 'Таблица 4x4',
                        Icon: FaTable,
                        defaultProps: { rows: 4, cols: 4 }
                    },
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
                        type: 'element',
                        label: 'Список',
                        Icon: FaList,
                        defaultProps: { content: '' }
                    },
                    {
                        id: 'numered-list',
                        type: 'element',
                        label: 'Нумерованный список',
                        Icon: FaList,
                        defaultProps: { content: '' }
                    },
                    {
                        id: 'todo-list',
                        type: 'element',
                        label: 'Список задач',
                        Icon: FaList,
                        defaultProps: { content: '' }
                    },
                ]
            },
            {
                id: 'boxes',
                label: 'Блоки',
                // Icon: FaBox,
                elements: [
                    // Box
                    {
                        id: 'box',
                        type: 'element',
                        label: 'Блок',
                        Icon: FaBox,
                        defaultProps: { content: '' }
                    },
                    // Note box
                    {
                        id: 'note-box',
                        type: 'element',
                        label: 'Блок с заметкой',
                        Icon: FaBox,
                        defaultProps: { content: '' }
                    },
                    // Info
                    {
                        id: 'info-box',
                        type: 'element',
                        label: 'Блок с информацией',
                        Icon: FaBox,
                        defaultProps: { content: '' }
                    },
                    // Warning
                    {
                        id: 'warning-box',
                        type: 'element',
                        label: 'Блок с предупреждением',
                        Icon: FaBox,
                        defaultProps: { content: '' }
                    },
                    // Caution
                    {
                        id: 'caution-box',
                        type: 'element',
                        label: 'Блок с предостережением',
                        Icon: FaBox,
                        defaultProps: { content: '' }
                    },
                    // Success
                    {
                        id: 'success-box',
                        type: 'element',
                        label: 'Блок с успехом',
                        Icon: FaBox,
                        defaultProps: { content: '' }
                    },
                    // Question
                    {
                        id: 'question-box',
                        type: 'element',
                        label: 'Блок с вопросом',
                        Icon: FaBox,
                        defaultProps: { content: '' }
                    },
                ]
            },
            {
                id: 'interactive',
                label: 'Интерактивные элементы',
                // Icon: FaInteractive,
                elements: [
                    // Button
                    {
                        id: 'button',
                        type: 'element',
                        label: 'Кнопка',
                        Icon: FaBox,
                        defaultProps: { content: 'Кнопка' }
                    },
                    // Toggle
                    {
                        id: 'toggle',
                        type: 'element',
                        label: 'Переключатель',
                        Icon: FaToggleOn,
                        defaultProps: { content: '' }
                    },
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
                defaultProps: { content: '' }
            },
            // Link
            {
                id: 'link',
                type: 'element',
                label: 'Ссылка',
                Icon: FaLink,
                defaultProps: { content: '' }
            },
            // QR
            {
                id: 'qr',
                type: 'element',
                label: 'QR-код',
                Icon: FaQrcode,
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
                defaultProps: { content: '' }
            },
            // Bar chart
            {
                id: 'bar-chart',
                type: 'element',
                label: 'Столбчатая диаграмма',
                Icon: FaRegChartBar,
                defaultProps: { content: '' }
            },
            // Line chart
            {
                id: 'line-chart',
                type: 'element',
                label: 'Линейная диаграмма',
                Icon: FaRegChartBar,
                defaultProps: { content: '' }
            },
            // Pie chart
            {
                id: 'pie-chart',
                type: 'element',
                label: 'Круговая диаграмма',
                Icon: FaRegChartBar,
                defaultProps: { content: '' }
            },
            // Donut  chart
            {
                id: 'donut-chart',
                type: 'element',
                label: 'Кольцевая диаграмма',
                Icon: FaRegChartBar,
                defaultProps: { content: '' }
            },
        ]
    }

]

// export const getElementConfig = (type: string): ElementConfig | undefined => {
//   return elementRegistry.find(element => element.type === type)
// }

// export const getElementsByCategory = (category: string): ElementConfig[] => {
//   return elementRegistry.filter(element => element.category === category)
// }
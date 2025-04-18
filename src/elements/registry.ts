import { generateId } from '@/utils/id';
import {
    type BaseElement,
    type EditorElement,
    type ElementConfig,
    type Category,
    type ImageElement,
    type Layout,
    type GridCell,
    type Element,
    type GridRow,
} from '@/types';
import {
    FaFont,
    FaTable,
    FaList,
    FaBox,
    FaImage,
    FaVideo,
    FaRegChartBar,
    FaLink,
    FaQuoteLeft,
    FaToggleOn,
} from 'react-icons/fa';
import editorsDefaultContent from './textEditor/defaultContent';

// Define components for the BubbleMenu
import HeadingBubbleMenu from '@/components/editor/Menus/BubbleMenus/HeadingBubbleMenu';
import QuoteBubbleMenu from '@/components/editor/Menus/BubbleMenus/QuoteBubbleMenu';
import TableBubbleMenu from '@/components/editor/Menus/BubbleMenus/TableBubbleMenu';
import ListBubbleMenu from '@/components/editor/Menus/BubbleMenus/ListBubbleMenu';
import BoxBubbleMenu from '@/components/editor/Menus/BubbleMenus/BoxBubbleMenu';
import DefaultBubbleMenu from '@/components/editor/Menus/BubbleMenus/DefaultBubbleMenu';
import ButtonMenu from '@/components/editor/Menus/ButtonMenu';

// Import our new Image components
import { ImageSettings } from './image';
import ChartSettings from './chart/ChartSettings';
import { getColumnWidths } from '@/components/editor/SlideEditor/SlideEditor';

// Define component type enum to better categorize elements by their structure
export enum ComponentStructureType {
    // Pure text editor without wrapper
    TEXT_EDITOR = 'text_editor',
    // Text editor with wrapper (like box, summary, etc.)
    WRAPPED_TEXT_EDITOR = 'wrapped_text_editor',
    // Custom component without text editor
    CUSTOM_COMPONENT = 'custom_component',
}

export const getNewTableLayout = (type: string): Layout | null => {
    if (!type.startsWith('table-')) {
        return null;
    }

    const elementConfig = elementsRegistry
        .flatMap(category =>
            category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements
        )
        .find(element => element?.elementTypeId === type);

    if (!elementConfig) {
        throw new Error(`Element with type ${type} not found in registry`);
    }

    const tableLayout: Layout = {
        id: generateId(),
        elements: [],
        gridStructure: {
            rows: elementConfig.defaultProps?.rows || 2,
            columns: elementConfig.defaultProps?.columns || 2,
            columnWidths: getColumnWidths(elementConfig.defaultProps?.columns || 2),
        },
        type: 'table',
        style: {},
        isTable: true,
    };

    const rows: GridRow[] = [];
    const elements: BaseElement[] = [];

    for (let rowIndex = 0; rowIndex < elementConfig.defaultProps?.rows; rowIndex++) {
        const cells: GridCell[] = [];

        const row: GridRow = {
            id: generateId(),
            cells: [],
        };

        for (let columnIndex = 0; columnIndex < elementConfig.defaultProps?.columns; columnIndex++) {
            const cellId = generateId();

            const cell: GridCell = {
                id: cellId,
                row: rowIndex,
                column: columnIndex,
            };
            cells.push(cell);

            const cellElement = getNewEditorElement(cellId);
            elements.push(cellElement);
        }

        row.cells = cells;
        rows.push(row);
    }
    tableLayout.gridStructure.rows = rows;
    tableLayout.elements = elements as Element[];

    return tableLayout;
};

export const getNewElement = (type: string): Omit<BaseElement, 'cellId'> | Layout | null => {
    // Find the element configuration in the registry
    const elementConfig = elementsRegistry
        .flatMap(category =>
            category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements
        )
        .find(element => element?.elementTypeId === type);

    if (!elementConfig) {
        throw new Error(`Element with type ${type} not found in registry`);
    }

    // Base properties for all elements
    const baseElement = {
        id: generateId(8),
        // type: elementConfig?.type as string, // Cast to TextElementType to fix type error
        // тип текста. не нуженЮ
        textType: (elementConfig?.defaultProps?.textType as 'text' | 'heading' | 'paragraph') || 'text', // Cast to valid textType with fallback
        content: elementConfig?.defaultProps?.content ?? '',
        // componentStructure: elementConfig?.componentStructure || ComponentStructureType.TEXT_EDITOR,
        // hasTextEditor: elementConfig?.hasTextEditor,
        elementTypeId: elementConfig?.elementTypeId,
    };

    // Special handling for image elements
    if (type === 'image') {
        return {
            ...baseElement,
            type: 'image',
            src: elementConfig?.defaultProps?.src || '',
            alt: elementConfig?.defaultProps?.alt || '',
            alignment: elementConfig?.defaultProps?.alignment || 'center',
            width: elementConfig?.defaultProps?.width || undefined,
        } as Omit<ImageElement, 'cellId'>;
    }

    // Special handling for chart elements
    if (type.includes('chart')) {
        // Determine chart type from element type ID
        let chartType: 'bar' | 'line' | 'pie' | 'donut' = 'bar';

        if (type === 'column-chart') chartType = 'bar';
        else if (type === 'bar-chart') chartType = 'bar';
        else if (type === 'line-chart') chartType = 'line';
        else if (type === 'pie-chart') chartType = 'pie';
        else if (type === 'donut-chart') chartType = 'donut';

        return {
            ...baseElement,
            type: 'chart',
            chartType,
            data: [
                { name: 'Q1', value: 220 },
                { name: 'Q2', value: 458 },
                { name: 'Q3', value: 359 },
                { name: 'Q4', value: 500 },
            ],
        } as Omit<ChartElement, 'cellId'>;
    }

    // Return default text element for other types
    return baseElement as Omit<BaseElement, 'cellId'>;
};

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
                        elementTypeId: 'text',
                        // type: ContainerType.EDITOR,
                        label: 'Текст',
                        Icon: FaFont,
                        // Define structure and menu type for component
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'text', content: '' },
                    },

                    {
                        elementTypeId: 'title',
                        // type: ContainerType.EDITOR,
                        label: 'Заголовок',
                        Icon: FaFont,
                        // Define structure and menu type for component
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 1, content: editorsDefaultContent.title },
                    },
                    {
                        elementTypeId: 'heading-1',
                        // type: ContainerType.EDITOR,
                        label: 'Подзаголовок 1',
                        Icon: FaFont,
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 2, content: editorsDefaultContent.heading1 },
                    },
                    {
                        elementTypeId: 'heading-2',
                        // type: ContainerType.EDITOR,
                        label: 'Подзаголовок 2',
                        Icon: FaFont,
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 3, content: editorsDefaultContent.heading2 },
                    },
                    {
                        elementTypeId: 'heading-3',
                        // type: ContainerType.EDITOR,
                        label: 'Подзаголовок 3',
                        Icon: FaFont,
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 4, content: editorsDefaultContent.heading3 },
                    },
                    {
                        elementTypeId: 'heading-4',
                        // type: ContainerType.EDITOR,
                        label: 'Подзаголовок 4',
                        Icon: FaFont,
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: HeadingBubbleMenu,
                        defaultProps: { textType: 'heading', level: 5, content: editorsDefaultContent.heading4 },
                    },
                    {
                        elementTypeId: 'quote',
                        // type: ContainerType.EDITOR,
                        label: 'Цитата',
                        Icon: FaQuoteLeft,
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: QuoteBubbleMenu,
                        defaultProps: { textType: 'quote', content: editorsDefaultContent.quote },
                    },
                ],
            },
            {
                id: 'tables',
                label: 'Таблицы',
                elements: [
                    {
                        elementTypeId: 'table-2x2',
                        // type: ContainerType.TABLE,
                        label: 'Таблица 2x2',
                        Icon: FaTable,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: false,
                        MenuComponent: TableBubbleMenu,
                        defaultProps: {
                            textType: 'table',
                            content: editorsDefaultContent.table2x2,
                            rows: 2,
                            columns: 2,
                            isTable: true, // Mark as a table for special handling
                        },
                    },
                    {
                        elementTypeId: 'table-3x3',
                        // type: ContainerType.TABLE,
                        label: 'Таблица 3x3',
                        Icon: FaTable,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: DefaultBubbleMenu,
                        defaultProps: {
                            textType: 'table',
                            content: editorsDefaultContent.table3x3,
                            rows: 3,
                            columns: 3,
                            isTable: true, // Mark as a table for special handling
                        },
                    },
                    {
                        elementTypeId: 'table-4x4',
                        // type: ContainerType.TABLE,
                        label: 'Таблица 4x4',
                        Icon: FaTable,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: DefaultBubbleMenu,
                        defaultProps: {
                            textType: 'table',
                            content: editorsDefaultContent.table4x4,
                            rows: 4,
                            columns: 4,
                            isTable: true, // Mark as a table for special handling
                        },
                    },
                ],
            },
            {
                id: 'lists',
                label: 'Списки',
                // Icon: FaList,
                elements: [
                    {
                        elementTypeId: 'bullet-list',
                        // type: ContainerType.EDITOR,
                        label: 'Список',
                        Icon: FaList,
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: ListBubbleMenu,
                        defaultProps: {
                            content: editorsDefaultContent.lists,
                        },
                    },
                    {
                        elementTypeId: 'numered-list',
                        // type: ContainerType.EDITOR,
                        label: 'Нумерованный список',
                        Icon: FaList,
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: ListBubbleMenu,
                        defaultProps: {
                            content: editorsDefaultContent.numeredList,
                        },
                    },
                    {
                        elementTypeId: 'todo-list',
                        // type: ContainerType.EDITOR,
                        label: 'Список задач',
                        Icon: FaList,
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: ListBubbleMenu,
                        defaultProps: {
                            content: editorsDefaultContent.todoList,
                        },
                    },
                ],
            },
            {
                id: 'boxes',
                label: 'Блоки',
                elements: [
                    {
                        elementTypeId: 'box',
                        // type: ContainerType.EDITOR,
                        label: 'Блок',
                        Icon: FaBox,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'box',
                            content: editorsDefaultContent.box,
                        },
                    },
                    {
                        elementTypeId: 'note-box',
                        // type: ContainerType.EDITOR,
                        label: 'Блок с заметкой',
                        Icon: FaBox,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'note-box',
                            content: editorsDefaultContent.noteBox,
                        },
                    },
                    {
                        elementTypeId: 'info-box',
                        // type: ContainerType.EDITOR,
                        label: 'Блок с информацией',
                        Icon: FaBox,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'info-box',
                            content: editorsDefaultContent.infoBox,
                        },
                    },
                    {
                        elementTypeId: 'warning-box',
                        // type: ContainerType.EDITOR,
                        label: 'Блок с предупреждением',
                        Icon: FaBox,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'warning-box',
                            content: editorsDefaultContent.warningBox,
                        },
                    },
                    {
                        elementTypeId: 'caution-box',
                        // type: ContainerType.EDITOR,
                        label: 'Блок с предостережением',
                        Icon: FaBox,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'caution-box',
                            content: editorsDefaultContent.cautionBox,
                        },
                    },
                    {
                        elementTypeId: 'success-box',
                        // type: ContainerType.EDITOR,
                        label: 'Блок с успехом',
                        Icon: FaBox,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'success-box',
                            content: editorsDefaultContent.successBox,
                        },
                    },
                    {
                        elementTypeId: 'question-box',
                        // type: ContainerType.EDITOR,
                        label: 'Блок с вопросом',
                        Icon: FaBox,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        MenuComponent: BoxBubbleMenu,
                        defaultProps: {
                            textType: 'question-box',
                            content: editorsDefaultContent.questionBox,
                        },
                    },
                ],
            },
            {
                id: 'interactive',
                label: 'Интерактивные элементы',
                elements: [
                    {
                        elementTypeId: 'button',
                        // type: ContainerType.EDITOR,
                        label: 'Кнопка',
                        Icon: FaBox,
                        componentStructure: ComponentStructureType.TEXT_EDITOR,
                        hasTextEditor: true,
                        customMenu: true,
                        // Custom menu specifically for buttons
                        MenuComponent: ButtonMenu,
                        // Indicates this has a special config with limited text formatting
                        hasLimitedTextFormatting: true,
                        defaultProps: {
                            textType: 'button',
                            content: editorsDefaultContent.button,
                        },
                    },
                    {
                        elementTypeId: 'toggle',
                        // type: ContainerType.EDITOR,
                        label: 'Переключатель',
                        Icon: FaToggleOn,
                        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
                        hasTextEditor: true,
                        // MenuComponent: DefaultBubbleMenu,
                        defaultProps: {
                            textType: 'details',
                            content: editorsDefaultContent.toggle,
                        },
                    },
                ],
            },
            // ... остальные подкатегории
        ],
    },
    {
        id: 'image',
        label: 'Изображения',
        Icon: FaImage,
        elements: [
            // Upload
            // {
            //     elementTypeId: 'upload',
            //     // type: ContainerType.ELEMENT,
            //     label: 'Загрузка изображения',
            //     Icon: FaUpload,
            //     componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
            //     hasTextEditor: false,
            //     // MenuComponent: DefaultBubbleMenu,
            //     defaultProps: { content: '' }
            // },
            // Link
            {
                elementTypeId: 'link',
                // type: ContainerType.ELEMENT,
                label: 'Ссылка',
                Icon: FaLink,
                componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
                hasTextEditor: false,
                // MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' },
            },
            // QR
            // {
            //     elementTypeId: 'qr',
            //     // type: ContainerType.ELEMENT,
            //     label: 'QR-код',
            //     Icon: FaQrcode,
            //     componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
            //     hasTextEditor: false,
            //     // MenuComponent: DefaultBubbleMenu,
            //     defaultProps: { content: '' }
            // },
        ],
    },
    {
        id: 'video',
        label: 'Видео',
        Icon: FaVideo,
        elements: [
            {
                elementTypeId: 'video',
                // type: ContainerType.ELEMENT,
                label: 'Видео',
                Icon: FaVideo,
                componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
                hasTextEditor: false,
                // MenuComponent: DefaultBubbleMenu,
                defaultProps: { content: '' },
            },
        ],
    },
    {
        id: 'charts',
        label: 'Диаграммы',
        Icon: FaRegChartBar,
        elements: [
            // Column chart
            {
                elementTypeId: 'column-chart',
                // type: ContainerType.ELEMENT,
                label: 'Столбчатая диаграмма',
                Icon: FaRegChartBar,
                componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
                hasTextEditor: false,
                MenuComponent: ChartSettings,
                defaultProps: { content: '' },
                customMenuType: 'chart',
            },
            // Bar chart
            {
                elementTypeId: 'bar-chart',
                // type: ContainerType.ELEMENT,
                label: 'Столбчатая диаграмма',
                Icon: FaRegChartBar,
                componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
                hasTextEditor: false,
                MenuComponent: ChartSettings,
                defaultProps: { content: '' },
                customMenuType: 'chart',
            },
            // Line chart
            {
                elementTypeId: 'line-chart',
                // type: ContainerType.ELEMENT,
                label: 'Линейная диаграмма',
                Icon: FaRegChartBar,
                componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
                hasTextEditor: false,
                MenuComponent: ChartSettings,
                defaultProps: { content: '' },
                customMenuType: 'chart',
            },
            // Pie chart
            {
                elementTypeId: 'pie-chart',
                // type: ContainerType.ELEMENT,
                label: 'Круговая диаграмма',
                Icon: FaRegChartBar,
                componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
                hasTextEditor: false,
                MenuComponent: ChartSettings,
                defaultProps: { content: '' },
                customMenuType: 'chart',
            },
            // Donut  chart
            {
                elementTypeId: 'donut-chart',
                // type: ContainerType.ELEMENT,
                label: 'Кольцевая диаграмма',
                Icon: FaRegChartBar,
                componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
                hasTextEditor: false,
                MenuComponent: ChartSettings,
                defaultProps: { content: '' },
                customMenuType: 'chart',
            },
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
                componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
                hasTextEditor: false,
                MenuComponent: ImageSettings,
                defaultProps: {
                    src: '',
                    alt: 'Image',
                    alignment: 'center',
                    width: undefined,
                },
            },
            // ... other media elements ...
        ],
    },
];

// Helper to get appropriate menu based on element and context
export const getElementMenuComponent = (
    elementId: string
): { MenuComponent: React.ComponentType<any>; menuDirection: 'bottom' | 'top'; menuHeight: number | undefined } => {
    const elementConfig = elementsRegistry
        .flatMap(category =>
            category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements
        )
        .find(element => element?.elementTypeId === elementId);

    if (elementConfig?.MenuComponent) {
        return {
            MenuComponent: elementConfig.MenuComponent,
            menuDirection: elementConfig.menuDirection || 'bottom',
            menuHeight: elementConfig.menuHeight || 0,
        };
    }

    return {
        MenuComponent: DefaultBubbleMenu,
        menuDirection: 'bottom',
        menuHeight: undefined,
    };
};

const emptyTextElement = elementsRegistry
    .flatMap(category =>
        category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements
    )
    .find(element => element?.elementTypeId === 'text');

export const getNewEditorElement = (cellId: string, content?: string): EditorElement => {
    const newEditor: EditorElement = {
        id: generateId(),
        // textType: 'text',
        content: content || '',
        cellId,
        elementTypeId: emptyTextElement!.elementTypeId,
        // type: emptyTextElement!.type as any,
        // componentStructure: emptyTextElement!.componentStructure,
        // hasTextEditor: true,
    };

    return newEditor;
};

// Check if an element has text editing capabilities
export const hasTextEditor = (elementId: string): boolean => {
    const elementConfig = elementsRegistry
        .flatMap(category =>
            category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements
        )
        .find(element => element?.elementTypeId === elementId);

    return elementConfig?.hasTextEditor ?? false;
};

// Check if element uses limited text formatting (like button)
export const hasLimitedTextFormatting = (elementId: string): boolean => {
    const elementConfig = elementsRegistry
        .flatMap(category =>
            category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements
        )
        .find(element => element?.elementTypeId === elementId);

    return elementConfig?.hasLimitedTextFormatting ?? false;
};

// Get component structure type
export const getComponentStructureType = (elementId: string): ComponentStructureType | undefined => {
    const elementConfig = elementsRegistry
        .flatMap(category =>
            category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements
        )
        .find(element => element?.elementTypeId === elementId);

    return elementConfig?.componentStructure;
};

export const getElementConfig = (elementId: string): ElementConfig => {
    const elementConfig = elementsRegistry
        .flatMap(category =>
            category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements
        )
        .find(element => element?.elementTypeId === elementId);

    if (!elementConfig) {
        return {};
        // throw new Error(`Element with type ${elementId} not found in registry`);
    }

    return elementConfig;
};

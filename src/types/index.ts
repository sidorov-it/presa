import { EditorWithMethods } from '@/components/tiptap/extensions/ArrowNavigationExtension';
import { MenuItem } from '@/elements/menuRegistry';
import { generateId } from '@/utils/id';
import { IconType } from 'react-icons/lib';

export const SLIDE_TEMPLATES = [
    { value: 'standard', label: 'Standard (No Image)' },
    { value: 'imageTop', label: 'Image Top' },
    { value: 'imageLeft', label: 'Image Left' },
    { value: 'imageRight', label: 'Image Right' },
    { value: 'imageBackground', label: 'Image Background' },
];

// This enum represents the core element types in the system
export enum ElementType {
    // Basic elements
    // TEXT = 'text',
    // HEADING = 'heading',
    // PARAGRAPH = 'paragraph',
    // LIST = 'list',
    // QUOTE = 'quote',

    // Media elements
    IMAGE = 'image',
    VIDEO = 'video',

    // UI elements
    // DIVIDER = 'divider',
    // BUTTON = 'button',
    // TOGGLE = 'toggle',
    // ICON = 'icon',
    // BOX = 'box',

    // Data visualization
    CHART = 'chart',
    // TABLE = 'table',

    // Special elements
    EDITOR = 'editor',
    SMART_LAYOUT = 'smart-layout',
}

// This defines the content container type (elements can be placed in editors, tables, layouts, etc.)
// export enum ContainerType {
//     EDITOR = 'editor',
//     TABLE = 'table',
//     ELEMENT = 'element',
//     LAYOUT = 'layout',
//     SLIDE = 'slide'
// }

// Legacy type for backward compatibility - consider migrating away from this
// export type TextElementType =
//     | 'text'
//     | 'heading'
//     | 'paragraph'
//     | 'list'
//     | 'image'
//     | 'divider'
//     | 'icon'
//     | 'video'
//     | 'chart'
//     | 'button'
//     | 'editor';

// Legacy type for backward compatibility - consider migrating away from this
// export type ELEMENT_TYPE = 'editor' | 'element' | 'layout' | 'slide' | 'table';

export type LayoutType =
    | 'single-column'
    | 'two-columns-right'
    | 'two-columns-left'
    | 'two-columns-equal'
    | 'three-columns'
    | 'four-columns'
    | 'image-text'
    | 'text-image'
    | 'cards'
    | 'icons-with-text'
    | 'blank'
    | 'table'
    | 'custom'; // User-defined grid layouts

// Интерфейс для ячейки сетки
export interface GridCell {
    id: string;
    row: number;
    column: number;
    alignment?: 'top' | 'center' | 'bottom';
    //   rowSpan: number;
    //   colSpan: number;
}

// Интерфейс для строки сетки
export interface GridRow {
    id: string;
    cells: GridCell[];
}

// Интерфейс для определения структуры сетки с поддержкой объединения ячеек
export interface GridStructure {
    columns: number;
    rows: GridRow[];
    columnWidths: string[];
}

export const getPredefinedGridStructures = (name: LayoutType): GridStructure => {
    switch (name) {
        case 'single-column':
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }],
                    },
                ],
                columnWidths: ['100%'],
            };
        case 'two-columns-equal':
            return {
                columns: 2,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                        ],
                    },
                ],
                columnWidths: ['50%', '50%'],
            };
        case 'three-columns':
            return {
                columns: 3,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                            { id: generateId(8), row: 1, column: 3 },
                        ],
                    },
                ],
                columnWidths: ['33.33%', '33.34%', '33.33%'],
            };
        case 'four-columns':
            return {
                columns: 4,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                            { id: generateId(8), row: 1, column: 3 },
                            { id: generateId(8), row: 1, column: 4 },
                        ],
                    },
                ],
                columnWidths: ['25%', '25%', '25%', '25%'],
            };
        case 'image-text':
            return {
                columns: 2,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                        ],
                    },
                ],
                columnWidths: ['50%', '50%'],
            };
        case 'text-image':
            return {
                columns: 2,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                        ],
                    },
                ],
                columnWidths: ['50%', '50%'],
            };
        case 'cards':
            return {
                columns: 2,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                        ],
                    },
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 2, column: 1 },
                            { id: generateId(8), row: 2, column: 2 },
                        ],
                    },
                ],
                columnWidths: ['50%', '50%'],
            };
        case 'icons-with-text':
            return {
                columns: 3,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                            { id: generateId(8), row: 1, column: 3 },
                        ],
                    },
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 2, column: 1 },
                            { id: generateId(8), row: 2, column: 2 },
                            { id: generateId(8), row: 2, column: 3 },
                        ],
                    },
                ],
                columnWidths: ['33.33%', '33.34%', '33.33%'],
            };
        case 'blank':
            return {
                columns: 1,
                rows: [],
                columnWidths: ['100%'],
            };
        default:
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }],
                    },
                ],
                columnWidths: ['100%'],
            };
    }
};
export interface Position {
    x: number;
    y: number;
}

// Table related types
export interface TableCellData {
    id: string;
    elements: BaseElement[];
}

export interface TableData {
    headers: TableCellData[];
    rows: TableCellData[][];
}

export interface Size {
    width: number;
    height: number;
}

export interface Style {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    borderRadius?: string;
    borderColor?: string;
    borderWidth?: string;
    padding?: string;
    margin?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
}

// Базовый интерфейс для всех элементов
export interface BaseElement {
    id: string;
    // type: TextElementType;
    cellId: string; // Reference to the cell this element belongs to
    // componentStructure: ComponentStructureType;
    // hasTextEditor: boolean;
    elementTypeId: string;
}

export interface SmartLayoutItem {
    id: string;
    title: string;
    text: string;
    imageUrl?: string;
    iconUrl?: string;
    stats?: { value: string; label: string };
    metadata?: Record<string, unknown>;
}

export type ImageShape = 'square' | 'landscape' | 'portrait' | 'circle';

export interface SmartLayoutElement extends BaseElement {
    type: 'smart-layout';
    elementVariant: SmartLayoutType;
    items: SmartLayoutItem[];
    columnSize: number;
    align: 'left' | 'center' | 'right';
    imageShape: ImageShape;
    imageSize: number;
}

// Элемент редактора Tiptap
export interface EditorElement extends BaseElement {
    content: string;
    placeholder?: string;
    tempEditor?: boolean;
    tempLayout?: boolean;
}

// Элемент изображения
export interface ImageElement extends BaseElement {
    type: 'image';
    src: string;
    alt: string;
    alignment?: 'left' | 'center' | 'right';
    width?: number;
    uploaded?: boolean;
}

// Элемент диаграммы
export interface ChartElement extends BaseElement {
    type: 'chart';
    elementVariant: 'bar' | 'line' | 'pie' | 'donut' | 'column';
    data: {
        name: string;
        [key: string]: string | number; // Allow any number of data series
    }[];
    series?: {
        key: string;
        label: string;
        color?: string;
    }[];
    alignment?: 'left' | 'center' | 'right';
    width?: number;
    height?: number;
    showLabels?: boolean;
    showValues?: boolean;
    legendPosition?: 'left' | 'right' | 'top' | 'bottom';
}

export interface ButtonElement extends BaseElement {
    type: 'button';
    link: string;
    buttonStyle: 'filled' | 'outlined';
    alignment: 'left' | 'center' | 'right';
    color: string;
}

export interface BoxElement extends BaseElement {
    type: 'box';
    content: string;
    iconType?: string;
    backgroundColor?: string;
    Icon?: IconType;
    customBackgroundColor?: string;
    darkBackgroundColor?: string;
    darkColor?: string;
}

// Объединенный тип элемента
export type Element =
    // | TextElement
    | EditorElement
    | SmartLayoutElement
    // | ListElement
    | ImageElement
    // | DividerElement
    // | IconElement
    | ChartElement
    | ButtonElement
    | BoxElement;

// Интерфейс макета с поддержкой объединения ячеек
export interface Layout {
    id: string;
    gridStructure: GridStructure;
    type: LayoutType;
    style: Record<string, unknown>;
    elements: BaseElement[];
    isTable?: boolean; // Flag to identify when layout should be treated as a table
    parentId?: string; // Reference to parent layout if nested
}

export interface Slide {
    id: string;
    title?: string;
    layouts: Layout[];
    background?: {
        type: 'color' | 'image';
        value: string;
    };
    style?: Style;
    templateType?: (typeof SLIDE_TEMPLATES)[number]['value'];
    imageUrl?: string;
    imageSize?: {
        width?: string;
        height?: string;
    };
    contentAlignment?: 'top' | 'center' | 'bottom';
    textColor?: string; // Store slide-specific text color
}

export interface BackgroundSettings {
    backgroundColor?: string;
    backgroundImage?: string;
}

// Интерфейс презентации
export interface IPresentation {
    id: string;
    title: string;
    description?: string;
    slides: Slide[];
    themeId?: string | null;
    createdAt: number;
    updatedAt: number;
    backgroundSettings?: BackgroundSettings;
}

// Definition for registry element configuration
export interface ElementConfig {
    elementTypeId: string;
    // type: ContainerType | string;
    label: string;
    Icon?: IconType;
    defaultProps?: Record<string, any>;
    MenuComponent?: React.ComponentType<any>;
    menuDirection?: 'bottom' | 'top';
    menuHeight?: number;
    openMenuOnFocus?: boolean;
    componentStructure: ComponentStructureType;
    hasTextEditor?: boolean;
    hasLimitedTextFormatting?: boolean;
    customMenu?: boolean;
    customMenuType?: MenuElementType;
    tempEditor?: boolean; // Флаг для временных редакторов, созданных кликом между элементами
}

export interface SubCategory {
    id: string;
    label: string;
    elements: ElementConfig[];
}

export interface Category {
    id: string;
    label: string;
    Icon: IconType;
    subCategories?: SubCategory[];
    elements?: ElementConfig[];
}

export type TipTapRefs = {
    editors: Record<string, EditorWithMethods>;
    editorRefs: React.RefObject<HTMLDivElement>[];
};

export type ElementMenuProps = {
    presentationId: string;
    slideId: string;
    layoutId: string;
    cellId: string;
    elementId: string;
};

export enum ComponentStructureType {
    // Pure text editor without wrapper
    TEXT_EDITOR = 'text_editor',
    // Text editor with wrapper (like box, summary, etc.)
    WRAPPED_TEXT_EDITOR = 'wrapped_text_editor',
    // Custom component without text editor
    CUSTOM_COMPONENT = 'custom_component',
}

export type MenuElementType = 'element' | 'cell' | 'layout' | 'slide' | 'editor' | 'row' | 'table' | 'column';

export type SmartLayoutType =
    | 'bullets'
    | 'text-boxes'
    | 'images-with-text'
    | 'icon-with-text'
    | 'timeline'
    | 'arrow-flow'
    | 'stats-grid'
    | 'comparison'
    | 'process-flow';

export type DragElementType =
    | 'element'
    | 'layout'
    | 'cell'
    | 'table-row'
    | 'table-column'
    | 'table'
    | 'smart-layout-item'
    | 'slide';

export interface SlideTemplateConfig extends Pick<Slide, 'contentAlignment'> {
    layouts: Array<{
        layout: LayoutType;
        elements: Array<Pick<MenuItem, 'elementTypeId' | 'defaultProps' | 'elementVariant'>>;
    }>;
}

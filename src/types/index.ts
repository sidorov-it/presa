import { EditorWithMethods } from '@/components/tiptap/extensions/ArrowNavigationExtension';
import { IconType } from 'react-icons/lib';
import { TemplateElement } from './templates';
import { ElementType } from './elements';

export const SLIDE_TEMPLATES = [
    { value: 'standard', label: 'Standard (No Image)' },
    { value: 'imageTop', label: 'Image Top' },
    { value: 'imageLeft', label: 'Image Left' },
    { value: 'imageRight', label: 'Image Right' },
    { value: 'imageBackground', label: 'Image Background' },
];

export type LayoutType =
    | 'blank'
    | 'image-text'
    | 'text-image'
    | 'heading'
    | 'two-columns-equal'
    | 'three-columns'
    | 'two-columns-headings'
    | 'three-columns-headings'
    | 'four-columns'
    | 'title-bullets'
    | 'title-bullets-image'
    | 'accent-left'
    | 'accent-right'
    | 'accent-top'
    | 'accent-right-fit'
    | 'accent-left-fit'
    | 'accent-background'
    | 'two-image-columns'
    | 'three-image-columns'
    | 'four-image-columns'
    | 'images-with-title'
    | 'text-boxes-with-title'
    | 'bar-chart'
    | 'line-chart'
    | 'pie-chart'
    | 'donut-chart'
    | 'three-row-table'
    | 'table'
    | 'welcome-slide'
    | 'final-slide-contacts'
    | 'final-slide-contacts-qr';

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
    cellId: string; // Reference to the cell this element belongs to
    // hasTextEditor: boolean;
    elementTypeId: ElementType;
    elementVariant?: string;
}

export interface SmartLayoutItem {
    id: string;
    title: string;
    text: string;
    imageUrl?: string;
    iconUrl?: string;
    stats?: { value: string; label: string };
    metadata?: Record<string, unknown>;
    // AI generation fields for images (isGenerating хранится только на клиенте)
    generatedImages?: string[]; // Array of generated image URLs saved on server
    aiPrompt?: string;
    aiStyle?: string;
    aiCustomStyle?: string;
    uploaded?: boolean;
}

export type ImageShape = 'square' | 'landscape' | 'portrait' | 'circle';

export interface SmartLayoutElement extends BaseElement {
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
    src: string;
    alt: string;
    alignment?: 'left' | 'center' | 'right';
    width?: number;
    uploaded?: boolean;
    // AI generation fields (isGenerating хранится только на клиенте)
    generatedImages?: string[]; // Array of generated image URLs saved on server
    aiPrompt?: string;
    aiStyle?: string;
    aiCustomStyle?: string;
}

// Элемент диаграммы
export interface ChartElement extends BaseElement {
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
    link: string;
    buttonStyle: 'filled' | 'outlined';
    alignment: 'left' | 'center' | 'right';
    color: string;
}

export interface BoxElement extends BaseElement {
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
    type?: LayoutType;
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

    // AI generation metadata
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
}

// Definition for registry element configuration
export interface ElementConfig {
    elementTypeId: string;
    label: string;
    Icon?: IconType;
    props?: Record<string, any>;
    MenuComponent?: React.ComponentType<any>;
    menuDirection?: 'bottom' | 'top';
    menuHeight?: number;
    openMenuOnFocus?: boolean;
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

export type MenuElementType = 'element' | 'cell' | 'layout' | 'slide' | 'editor' | 'row' | 'table' | 'column' | 'chart';

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
        columnsCount: number;
        rowsCount: number;
        elements: TemplateElement[];
    }>;
}

export enum TextType {
    TITLE = 'title',
    HEADING1 = 'heading1',
    HEADING2 = 'heading2',
    HEADING3 = 'heading3',
    HEADING4 = 'heading4',
    QUOTE = 'quote',
    LISTS = 'lists',
    BULLET_LIST = 'bulletList',
    NUMERED_LIST = 'numeredList',
    TODO_LIST = 'todoList',
    DEFAULT = 'default',
}

export interface SlideText {
    slideId: string;
    text: string;
}

export interface GeneratedContent {
    slotId: string;
    elementId: string;
    content: string | Record<string, string>;
    imageUrl?: string;
}

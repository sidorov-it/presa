import { TextElementType, Position, Size, Style } from './index';

// Базовый интерфейс для всех элементов в сетке
export interface GridElement {
    id: string;
    type: TextElementType;
    position: Position;
    size: Size;
    style: Style;
    zIndex: number;
}

// Элемент текста
export interface GridTextElement extends GridElement {
    type: 'text' | 'heading' | 'paragraph';
    content: string;
}

// Элемент редактора Tiptap
export interface GridEditorElement extends GridElement {
    type: 'editor';
    content: string;
    placeholder?: string;
}

// Элемент списка
export interface GridListElement extends GridElement {
    type: 'list';
    items: string[];
    listType: 'bullet' | 'numbered';
}

// Элемент изображения
export interface GridImageElement extends GridElement {
    type: 'image';
    src: string;
    alt: string;
}

// Элемент разделителя
export interface GridDividerElement extends GridElement {
    type: 'divider';
}

// Элемент иконки
export interface GridIconElement extends GridElement {
    type: 'icon';
    iconName: string;
}

// Элемент видео
export interface GridVideoElement extends GridElement {
    type: 'video';
    src: string;
    autoplay: boolean;
    controls: boolean;
}

// Элемент диаграммы
export interface GridChartElement extends GridElement {
    type: 'chart';
    chartType: 'bar' | 'line' | 'pie' | 'donut';
    data: any; // Данные для диаграммы
}

// Элемент кнопки
export interface GridButtonElement extends GridElement {
    type: 'button';
    text: string;
    action: {
        type: 'link' | 'slide';
        target: string; // URL или ID слайда
    };
}

// Объединенный тип элемента
export type GridElementType =
    | GridTextElement
    | GridEditorElement
    | GridListElement
    | GridImageElement
    | GridDividerElement
    | GridIconElement
    | GridVideoElement
    | GridChartElement
    | GridButtonElement;
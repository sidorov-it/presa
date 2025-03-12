export type ElementType = 
  | 'text' 
  | 'heading' 
  | 'paragraph' 
  | 'list'
  | 'image' 
  | 'divider' 
  | 'icon' 
  | 'video' 
  | 'chart' 
  | 'button';

export type LayoutType =
  | 'single-column'
  | 'two-columns'
  | 'three-columns'
  | 'four-columns'
  | 'image-text'
  | 'text-image'
  | 'cards'
  | 'icons-with-text'
  | 'blank';

export interface Position {
  x: number;
  y: number;
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
  type: ElementType;
  position: Position;
  size: Size;
  style: Style;
  zIndex: number;
  gridArea?: string;
}

// Элемент текста
export interface TextElement extends BaseElement {
  type: 'text' | 'heading' | 'paragraph';
  content: string;
}

// Элемент списка
export interface ListElement extends BaseElement {
  type: 'list';
  items: string[];
  listType: 'bullet' | 'numbered';
}

// Элемент изображения
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
}

// Элемент разделителя
export interface DividerElement extends BaseElement {
  type: 'divider';
}

// Элемент иконки
export interface IconElement extends BaseElement {
  type: 'icon';
  iconName: string;
}

// Элемент видео
export interface VideoElement extends BaseElement {
  type: 'video';
  src: string;
  autoplay: boolean;
  controls: boolean;
}

// Элемент диаграммы
export interface ChartElement extends BaseElement {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'donut';
  data: any; // Данные для диаграммы
}

// Элемент кнопки
export interface ButtonElement extends BaseElement {
  type: 'button';
  text: string;
  action: {
    type: 'link' | 'slide';
    target: string; // URL или ID слайда
  };
}

// Объединенный тип элемента
export type Element = 
  | TextElement 
  | ListElement 
  | ImageElement 
  | DividerElement 
  | IconElement 
  | VideoElement 
  | ChartElement 
  | ButtonElement;

// Интерфейс макета
export interface Layout {
  id: string;
  type: LayoutType;
  elements: Element[];
  style: Style;
  gridTemplateAreas?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
}

// Интерфейс слайда
export interface Slide {
  id: string;
  title: string;
  layouts: Layout[];
  background: {
    type: 'color' | 'image';
    value: string;
  };
  style: Style;
}

// Интерфейс презентации
export interface Presentation {
  id: string;
  title: string;
  description?: string;
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
}

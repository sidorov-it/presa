// Базовый интерфейс для всех узлов дерева
export interface BaseNode {
  id: string;
  parentId: string | null; // null для корневого узла
  type: NodeType;
  position?: Position; // Позиция в родительском контейнере
  size?: Size; // Размер элемента
  style?: Style; // Стили элемента
  zIndex?: number; // Z-индекс для наложения элементов
}

// Типы узлов
export type NodeType = 'presentation' | 'slide' | 'layout' | 'element';

// Типы элементов
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

// Типы макетов
export type LayoutType =
  | 'single-column'
  | 'two-columns'
  | 'three-columns'
  | 'four-columns'
  | 'image-text'
  | 'text-image'
  | 'cards'
  | 'icons-with-text'
  | 'grid'
  | 'blank';

// Общие типы для всех элементов
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

// Узел презентации (корневой)
export interface PresentationNode extends BaseNode {
  type: 'presentation';
  title: string;
  description?: string;
  theme?: string;
  createdAt: number;
  updatedAt: number;
}

// Узел слайда
export interface SlideNode extends BaseNode {
  type: 'slide';
  title: string;
  background: {
    type: 'color' | 'image' | 'gradient';
    value: string;
  };
  transition?: {
    type: 'fade' | 'slide' | 'zoom';
    duration: number;
  };
}

// Узел макета
export interface LayoutNode extends BaseNode {
  type: 'layout';
  layoutType: LayoutType;
  gridTemplate: {
    areas?: string;
    columns?: string;
    rows?: string;
  };
  gap?: string;
}

// Базовый интерфейс для элементов
export interface ElementNode extends BaseNode {
  type: 'element';
  elementType: ElementType;
  gridArea?: string; // Область в CSS Grid
}

// Текстовый элемент
export interface TextElementNode extends ElementNode {
  elementType: 'text' | 'heading' | 'paragraph';
  content: string;
}

// Элемент списка
export interface ListElementNode extends ElementNode {
  elementType: 'list';
  items: string[];
  listType: 'bullet' | 'numbered';
}

// Элемент изображения
export interface ImageElementNode extends ElementNode {
  elementType: 'image';
  src: string;
  alt: string;
}

// Элемент разделителя
export interface DividerElementNode extends ElementNode {
  elementType: 'divider';
}

// Элемент иконки
export interface IconElementNode extends ElementNode {
  elementType: 'icon';
  iconName: string;
}

// Элемент видео
export interface VideoElementNode extends ElementNode {
  elementType: 'video';
  src: string;
  autoplay: boolean;
  controls: boolean;
}

// Элемент диаграммы
export interface ChartElementNode extends ElementNode {
  elementType: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'donut';
  data: any; // Данные для диаграммы
}

// Элемент кнопки
export interface ButtonElementNode extends ElementNode {
  elementType: 'button';
  text: string;
  action: {
    type: 'link' | 'slide';
    target: string; // URL или ID слайда
  };
}

// Объединенный тип элемента
export type ElementNodeUnion = 
  | TextElementNode 
  | ListElementNode 
  | ImageElementNode 
  | DividerElementNode 
  | IconElementNode 
  | VideoElementNode 
  | ChartElementNode 
  | ButtonElementNode;

// Объединенный тип узла
export type Node = 
  | PresentationNode 
  | SlideNode 
  | LayoutNode 
  | ElementNodeUnion; 
import { generateId } from "@/utils/id";

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
  | 'button'
  | 'editor';

export type LayoutType =
  | 'single-column'
  | 'two-columns'
  | 'three-columns'
  | 'four-columns'
  | 'image-text'
  | 'text-image'
  | 'cards'
  | 'icons-with-text'
  | 'blank'
  | 'custom'; // User-defined grid layouts

// Интерфейс для ячейки сетки
export interface GridCell {
  id: string;
  row: number;
  column: number;
  rowSpan: number;
  colSpan: number;
  elementIds: string[]; // IDs of elements placed in this cell
  gridArea?: string;    // CSS grid-area name for this cell
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
}

export const getPredefinedGridStructures = (name: LayoutType): GridStructure => {
  switch (name) {
    case 'single-column':
      return {
        columns: 1,
        rows: [
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 1, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          }
        ]
      };
    case 'two-columns':
      return {
        columns: 2,
        rows: [
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 1, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 2, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          }
        ]
      };
    case 'three-columns':
      return {
        columns: 3,
        rows: [
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 1, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 2, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 3, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          }
        ]
      };
    case 'four-columns':
      return {
        columns: 4,
        rows: [
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 1, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 2, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 3, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 4, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          }
        ]
      };
    case 'image-text':
      return {
        columns: 2,
        rows: [
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 1, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 2, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          }
        ]
      };
    case 'text-image':
      return {
        columns: 2,
        rows: [
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 1, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 2, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          }
        ]
      };
    case 'cards':
      return {
        columns: 2,
        rows: [
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 1, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 2, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          },
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 2, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 2, column: 2, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          }
        ]
      };
    case 'icons-with-text':
      return {
        columns: 3,
        rows: [
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 1, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 2, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 1, column: 3, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          },
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 2, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 2, column: 2, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) },
              { id: generateId(8), row: 2, column: 3, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          }
        ]
      };
    case 'blank':
      return {
        columns: 1,
        rows: []
      };

    case 'test': 
      return {
        "columns": 3,
        "rows": [
          {
            id:  generateId(8),
            "cells": [
              { id:  generateId(8), "row": 1, "column": 1, "rowSpan": 1, "colSpan": 1, "elementIds": [], "gridArea": generateId(8) },
              { id:  generateId(8), "row": 1, "column": 2, "rowSpan": 1, "colSpan": 1, "elementIds": [], "gridArea": generateId(8) },
              { id:  generateId(8), "row": 1, "column": 3, "rowSpan": 3, "colSpan": 1, "elementIds": [], "gridArea": generateId(8) }
            ]
          },
          {
            id:  generateId(8),
            "cells": [
              { id:  generateId(8), "row": 2, "column": 1, "rowSpan": 1, "colSpan": 1, "elementIds": [], "gridArea": generateId(8) },
              { id:  generateId(8), "row": 2, "column": 2, "rowSpan": 1, "colSpan": 1, "elementIds": [], "gridArea": generateId(8) }
            ]
          },
          {
            id:  generateId(8),
            "cells": [
              { id:  generateId(8), "row": 3, "column": 1, "rowSpan": 1, "colSpan": 1, "elementIds": [], "gridArea": generateId(8) },
              { id:  generateId(8), "row": 3, "column": 2, "rowSpan": 1, "colSpan": 1, "elementIds": [], "gridArea": generateId(8) }
            ]
          }
        ]
      }
      
    default: 
      return {
        columns: 1,
        rows: [
          {
            id:  generateId(8),
            cells: [
              { id: generateId(8), row: 1, column: 1, rowSpan: 1, colSpan: 1, elementIds: [], gridArea: generateId(8) }
            ]
          }
        ]
      };
  }
}
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
  cellId: string;   // Reference to the cell this element belongs to
}

// Элемент текста
export interface TextElement extends BaseElement {
  type: 'text' | 'heading' | 'paragraph';
  content: string;
}

// Элемент редактора Tiptap
export interface EditorElement extends BaseElement {
  type: 'editor';
  content: string;
  placeholder?: string;
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
  | EditorElement
  | ListElement
  | ImageElement
  | DividerElement
  | IconElement
  | VideoElement
  | ChartElement
  | ButtonElement;

// Интерфейс макета с поддержкой объединения ячеек
export interface Layout {
  id: string;
  type: LayoutType;
  elements: Element[];
  style: Style;
  gridStructure: GridStructure;
  parentId?: string;  // Reference to parent layout if nested
}

// Функция для создания новой ячейки
export const createGridCell = (
  row: number,
  column: number,
  rowSpan: number = 1,
  colSpan: number = 1,
  gridArea?: string
): GridCell => {
  const cellId = `cell-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
    id: cellId,
    row,
    column,
    rowSpan,
    colSpan,
    elementIds: [],
    gridArea: gridArea || `area-${cellId}`
  };
};

// Функция для создания новой строки
export const createGridRow = (cells: GridCell[] = []): GridRow => {
  return {
    id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    cells
  };
};

// Функция для генерации CSS Grid Template Areas из структуры сетки
export const generateGridTemplateAreas = (gridStructure: GridStructure): string => {
  // Создаем матрицу для представления сетки
  const maxRows = Math.max(...gridStructure.rows.map(row =>
    Math.max(...row.cells.map(cell => cell.row + cell.rowSpan - 1))), 0);

  if (maxRows === 0) return '""';

  // Инициализируем матрицу пустыми значениями
  const grid: string[][] = Array(maxRows).fill(null)
    .map(() => Array(gridStructure.columns).fill('.'));

  // Заполняем матрицу именами областей
  gridStructure.rows.forEach(row => {
    row.cells.forEach(cell => {
      const areaName = cell.id || `area-${cell.id}`;

      // Заполняем все ячейки, которые охватывает данная ячейка
      for (let r = cell.row - 1; r < cell.row - 1 + cell.rowSpan; r++) {
        for (let c = cell.column - 1; c < cell.column - 1 + cell.colSpan; c++) {
          if (r < maxRows && c < gridStructure.columns) {
            grid[r][c] = areaName;
          }
        }
      }
    });
  });

  // Преобразуем матрицу в строку grid-template-areas
  return grid.map(row => `"${row.join(' ')}"`).join(' ');
};

// Функция для генерации CSS Grid Template Columns из структуры сетки
export const generateGridTemplateColumns = (gridStructure: GridStructure): string => {
  return Array(gridStructure.columns).fill('1fr').join(' ');
};

// Функция для генерации CSS Grid Template Rows из структуры сетки
export const generateGridTemplateRows = (gridStructure: GridStructure): string => {
  const maxRows = Math.max(...gridStructure.rows.map(row =>
    Math.max(...row.cells.map(cell => cell.row + cell.rowSpan - 1))), 0);

  return Array(maxRows).fill('auto').join(' ');
};

// Функция для создания нового макета
export const createLayout = (type: LayoutType = 'blank'): Layout => {
  const id = `layout-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let gridStructure: GridStructure;

  if (type !== 'custom') {
    // Используем предопределенную структуру для стандартных типов
    gridStructure = JSON.parse(JSON.stringify(getPredefinedGridStructures[type]));
  } else {
    // Создаем пустую структуру для пользовательских макетов
    gridStructure = {
      columns: 1,
      rows: []
    };
  }

  return {
    id,
    type,
    elements: [],
    style: {},
    gridStructure
  };
};

// Функция для добавления элемента в ячейку
export const addElementToCell = (layout: Layout, element: Element, cellId: string): Layout => {
  // Находим ячейку по ID
  let cellFound = false;

  const updatedRows = layout.gridStructure.rows.map(row => {
    const updatedCells = row.cells.map(cell => {
      if (cell.id === cellId) {
        cellFound = true;
        return {
          ...cell,
          elementIds: [...cell.elementIds, element.id]
        };
      }
      return cell;
    });

    return {
      ...row,
      cells: updatedCells
    };
  });

  if (!cellFound) {
    throw new Error(`Cell with ID ${cellId} not found in layout`);
  }

  // Обновляем элемент, чтобы он ссылался на ячейку
  const updatedElement = {
    ...element,
    cellId
  };

  return {
    ...layout,
    gridStructure: {
      ...layout.gridStructure,
      rows: updatedRows
    },
    elements: [...layout.elements, updatedElement]
  };
};

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

// Функция для обновления grid-area ячейки
export const updateCellGridArea = (layout: Layout, cellId: string, gridArea: string): Layout => {
  const updatedRows = layout.gridStructure.rows.map(row => {
    const updatedCells = row.cells.map(cell => {
      if (cell.id === cellId) {
        return {
          ...cell,
          gridArea
        };
      }
      return cell;
    });

    return {
      ...row,
      cells: updatedCells
    };
  });

  return {
    ...layout,
    gridStructure: {
      ...layout.gridStructure,
      rows: updatedRows
    }
  };
};

// Функция для получения CSS стилей для элемента на основе его ячейки
export const getElementGridStyles = (layout: Layout, elementId: string): { gridArea: string } | null => {
  const element = layout.elements.find(el => el.id === elementId);
  if (!element) return null;

  let gridArea: string | undefined;

  // Ищем ячейку, содержащую элемент
  for (const row of layout.gridStructure.rows) {
    for (const cell of row.cells) {
      if (cell.elementIds.includes(elementId)) {
        gridArea = cell.id || `area-${cell.id}`;
        break;
      }
    }
    if (gridArea) break;
  }

  return gridArea ? { gridArea } : null;
};

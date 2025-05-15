import { DragElementType, Slide } from '.';

// Define DnD export types
export type DragSource = {
    elementId: string | null;
    layoutId: string | null;
    cellId?: string | null;
    tableId?: string | null;
    rowIndex?: number | null;
    columnIndex?: number | null;
    smartLayoutItemId?: string | null;
    slideId?: string | null;
    dragElementType?: DragElementType;
};

export type Position = 'top' | 'bottom' | 'left' | 'right';

export type DropTarget = {
    elementId: string | null;
    layoutId?: string | null;
    cellId?: string | null;
    position: Position | null;
    tableId?: string | null;
    columnIndex?: number | null;
    rowIndex?: number | null;
    slideId?: string | null;
};

export type DragState = 'idle' | 'dragging' | 'dropping';

// Добавим тип для положения мыши
export type MousePosition = {
    x: number;
    y: number;
};

export type DndState = {
    dragState: DragState;
    source: DragSource;
    target: DropTarget;
    indicators: {
        elementIndicator: string | null;
        elementPosition: Position | null;
        layoutIndicator: string | null;
        layoutPosition: Position | null;
        slideIndicator: string | null;
        slidePosition: Position | null;
        cellIndicator: string | null;
        cellPosition: Position | null;
        tableColumnIndicator: number | null;
        tableColumnPosition: Position | null;
        tableRowIndicator: number | null;
        tableRowPosition: Position | null;
        tableId: string | null;
        cellId: string | null;
    };
    isReadyToDrop: boolean;
    newElement: {
        id: string | null;
        elementTypeId: string | null;
        elementVariant: string | null;
        props: any;
    };
    newSlide: Partial<Slide> | null;
    lastMousePosition?: MousePosition | null; // Добавляем lastMousePosition
};

export type DndAction =
    | {
          type: 'START_DRAG';
          payload: {
              elementId: string | null;
              layoutId?: string | null;
              cellId?: string | null;
              tableId?: string | null;
              rowIndex?: number | null;
              columnIndex?: number | null;
              smartLayoutItemId?: string | null;
              slideId?: string | null;
          };
      }
    | { type: 'SET_DROP_TARGET'; payload: DropTarget }
    | { type: 'SET_ELEMENT_INDICATOR'; payload: { elementId: string | null; position: Position | null } }
    | { type: 'SET_CELL_INDICATOR'; payload: { cellId: string | null; position: Position | null } }
    | {
          type: 'SET_TABLE_COLUMN_INDICATOR';
          payload: {
              cellId: string | null;
              columnIndex: number | null;
              position: Position | null;
              tableId: string | null;
          };
      }
    | {
          type: 'SET_TABLE_ROW_INDICATOR';
          payload: {
              cellId: string | null;
              rowIndex: number | null;
              position: Position | null;
              tableId: string | null;
          };
      }
    | { type: 'SET_LAYOUT_INDICATOR'; payload: { layoutId: string | null; position: Position | null } }
    | { type: 'SET_SLIDE_INDICATOR'; payload: { slideId: string | null; position: Position | null } }
    | { type: 'SET_COLUMN_INDICATOR'; payload: { columnId: string | null; position: Position | null } }
    | { type: 'COMPLETE_DROP' }
    | { type: 'CANCEL_DRAG' }
    | { type: 'SET_READY_TO_DROP'; payload: boolean }
    | {
          type: 'START_DRAG_MENU_ITEM';
          payload: {
              id: string;
              props: any;
              elementTypeId: string;
              elementVariant: string;
              isSlideTemplate?: boolean;
          };
      }
    | { type: 'SET_MOUSE_POSITION'; payload: MousePosition }
    | { type: 'SET_INDICATORS'; payload: Partial<DndState['indicators']> };

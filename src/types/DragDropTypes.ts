// Define DnD export types
export type DragSource = {
    elementId: string | null;
    layoutId: string | null;
    cellId?: string | null;
    tableId?: string | null;
    rowIndex?: number | null;
    columnIndex?: number | null;
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
};

export type DragState = 'idle' | 'dragging' | 'dropping';

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
        cellIndicator: string | null;
        cellPosition: Position | null;
        tableColumnIndicator: number | null;
        tableColumnPosition: Position | null;
        tableRowIndicator: number | null;
        tableRowPosition: Position | null;
        tableId: string | null;
    };
    isReadyToDrop: boolean;
    newElement: {
        id: string | null;
        defaultProps: any;
    }
};

export type DndAction =
    | { type: 'START_DRAG'; payload: { elementId: string | null; layoutId?: string; cellId?: string; tableId?: string; rowIndex?: number; columnIndex?: number } }
    | { type: 'SET_DROP_TARGET'; payload: DropTarget }
    | { type: 'SET_ELEMENT_INDICATOR'; payload: { elementId: string | null; position: Position | null } }
    | { type: 'SET_CELL_INDICATOR'; payload: { cellId: string | null; position: Position | null } }
    | { type: 'SET_TABLE_COLUMN_INDICATOR'; payload: { cellId: string | null; columnIndex: number | null; position: Position | null, tableId: string | null } }
    | { type: 'SET_TABLE_ROW_INDICATOR'; payload: { cellId: string | null; rowIndex: number | null; position: Position | null, tableId: string | null } }
    | { type: 'SET_LAYOUT_INDICATOR'; payload: { layoutId: string | null; position: Position | null } }
    | { type: 'SET_SLIDE_INDICATOR'; payload: string | null }
    | { type: 'COMPLETE_DROP' }
    | { type: 'CANCEL_DRAG' }
    | { type: 'SET_READY_TO_DROP'; payload: boolean }
    | { type: 'START_DRAG_MENU_ITEM'; payload: { id: string | null; defaultProps: any } }
    | { type: 'SET_COLUMN_INDICATOR'; payload: { columnId: string | null; position: Position | null } };


// Define DnD export types
export type DragSource = {
    elementId: string | null;
    layoutId: string | null;
    cellId?: string | null;
};

export type Position = 'top' | 'bottom' | 'left' | 'right';

export type DropTarget = {
    elementId: string | null;
    layoutId: string | null;
    cellId?: string | null;
    position: Position | null;
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
    };
    isReadyToDrop: boolean;
};

export type DndAction =
    | { type: 'START_DRAG'; payload: { elementId: string | null; layoutId: string; cellId?: string } }
    | { type: 'SET_DROP_TARGET'; payload: DropTarget }
    | { type: 'SET_ELEMENT_INDICATOR'; payload: { elementId: string | null; position: Position | null } }
    | { type: 'SET_CELL_INDICATOR'; payload: { cellId: string | null; position: Position | null } }
    | { type: 'SET_LAYOUT_INDICATOR'; payload: { layoutId: string | null; position: Position | null } }
    | { type: 'SET_SLIDE_INDICATOR'; payload: string | null }
    | { type: 'COMPLETE_DROP' }
    | { type: 'CANCEL_DRAG' }
    | { type: 'SET_READY_TO_DROP'; payload: boolean };

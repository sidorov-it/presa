import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface SelectState {
    hoveredRow: string | null;
    hoveredColumn: string | null;
    hoveredRowIndex: number | null;
    hoveredColumnIndex: number | null;
    hoveredTableId: string | null;
    hoverColumn: (tableId: string, columnId: string | null) => void;
    hoverRow: (tableId: string, rowId: string | null) => void;
    hoverColumnIndex: (tableId: string, columnIndex: number | null) => void;
    hoverRowIndex: (tableId: string, rowIndex: number | null) => void;
}

export const useSelectStore = create<SelectState>()(
    devtools(
        (set, get) => ({
            hoveredRow: null,
            hoveredColumn: null,
            hoveredRowIndex: null,
            hoveredColumnIndex: null,
            hoverColumn: (tableId: string, columnId: string | null) => set({ hoveredColumn: columnId, hoveredTableId: tableId }),
            hoverRow: (tableId: string, rowId: string | null) => set({ hoveredRow: rowId, hoveredTableId: tableId }),
            hoverColumnIndex: (tableId: string, columnIndex: number | null) => set({ hoveredColumnIndex: columnIndex, hoveredTableId: tableId }),
            hoverRowIndex: (tableId: string, rowIndex: number | null) => set({ hoveredRowIndex: rowIndex, hoveredTableId: tableId }),
        }),
        {
            name: 'select-store',
            enabled: true,
        }
    )
);

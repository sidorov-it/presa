import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface MenuState {
    hoveredRow: string | null;
    hoveredColumn: string | null;
    hoveredRowIndex: number | null;
    hoveredColumnIndex: number | null;
    hoveredTableId: string | null;
    selectedRow: number | null;
    selectedColumn: number | null;
    selectedTableId: string | null;
    hoverColumn: (tableId: string, columnId: string | null) => void;
    hoverRow: (tableId: string, rowId: string | null) => void;
    hoverColumnIndex: (tableId: string, columnIndex: number | null) => void;
    hoverRowIndex: (tableId: string, rowIndex: number | null) => void;
    setSelectedRow: (tableId: string, rowIndex: number | null) => void;
    setSelectedColumn: (tableId: string, columnIndex: number | null) => void;
}

export const useMenuStore = create<MenuState>()(
    devtools(
        (set, get) => ({
            hoveredRow: null,
            hoveredColumn: null,
            hoveredRowIndex: null,
            hoveredColumnIndex: null,
            hoveredTableId: null,
            selectedRow: null,
            selectedColumn: null,
            selectedTableId: null,
            hoverColumn: (tableId: string, columnId: string | null) => set({ hoveredColumn: columnId, hoveredTableId: tableId }),
            hoverRow: (tableId: string, rowId: string | null) => set({ hoveredRow: rowId, hoveredTableId: tableId }),
            hoverColumnIndex: (tableId: string, columnIndex: number | null) => set({ hoveredColumnIndex: columnIndex, hoveredTableId: tableId }),
            hoverRowIndex: (tableId: string, rowIndex: number | null) => set({ hoveredRowIndex: rowIndex, hoveredTableId: tableId }),
            setSelectedRow: (tableId: string, rowIndex: number | null) => set({ selectedRow: rowIndex, selectedTableId: tableId }),
            setSelectedColumn: (tableId: string, columnIndex: number | null) => set({ selectedColumn: columnIndex, selectedTableId: tableId }),
        }),
        {
            name: 'menu-store',
            enabled: true,
        }
    )
);

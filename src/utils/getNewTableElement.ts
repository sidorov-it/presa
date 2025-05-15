import { BaseElement, Element, GridCell, GridRow, Layout } from '@/types';
import { generateId } from './id';
import { getNewEditorElement } from '@/utils/getNewEditorElement';
import { MenuItem } from '@/types/templates';
import getColumnWidths from './getColumnWidths';

export const getNewTableElement = (menuItem: Pick<MenuItem, 'elementTypeId' | 'elementVariant' | 'props'>): Layout => {
    const tableLayout: Layout = {
        id: generateId(),
        elements: [],
        type: 'table',
        gridStructure: {
            rows: menuItem.props?.rows || 2,
            columns: menuItem.props?.columns || 2,
            columnWidths: getColumnWidths(menuItem.props?.columns || 2),
        },
        style: {},
        isTable: true,
    };

    const rows: GridRow[] = [];
    const elements: BaseElement[] = [];

    for (let rowIndex = 0; rowIndex < menuItem.props?.rows; rowIndex++) {
        const cells: GridCell[] = [];

        const row: GridRow = {
            id: generateId(),
            cells: [],
        };

        for (let columnIndex = 0; columnIndex < menuItem.props?.columns; columnIndex++) {
            const cellId = generateId();

            const cell: GridCell = {
                id: cellId,
                row: rowIndex,
                column: columnIndex,
            };
            cells.push(cell);

            const cellElement = getNewEditorElement(cellId);
            elements.push(cellElement);
        }

        row.cells = cells;
        rows.push(row);
    }
    tableLayout.gridStructure.rows = rows;
    tableLayout.elements = elements as Element[];

    return tableLayout;
};

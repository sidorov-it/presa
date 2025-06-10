import { BaseElement, Element, GridCell, GridRow, Layout } from '@/types';
import { generateId } from './id';
import { getNewEditorElement } from '@/utils/getNewEditorElement';
import getColumnWidths from './getColumnWidths';

export const getNewLayoutWithTable = (columnsCount = 2, rowsCount = 2): Layout => {
    const rows: GridRow[] = [];
    const elements: BaseElement[] = [];

    for (let rowIndex = 0; rowIndex < rowsCount; rowIndex++) {
        const cells: GridCell[] = [];

        const row: GridRow = {
            id: generateId(),
            cells: [],
        };

        for (let columnIndex = 0; columnIndex < columnsCount; columnIndex++) {
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

    const tableLayout: Layout = {
        id: generateId(),
        elements: elements as Element[],
        type: 'table',
        gridStructure: {
            rows,
            columns: columnsCount,
            columnWidths: getColumnWidths(columnsCount),
        },
        style: {},
        isTable: true,
    };

    return tableLayout;
};

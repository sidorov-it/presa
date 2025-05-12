import getColumnWidths from '@/utils/getColumnWidths';
import { Layout } from '@/types';
import { generateId } from './id';
import { getNewEditorElement } from '@/elements/registry';

export default function getNewLayoutWithTextEditor(): Layout {
    const newTextEditorElement = getNewEditorElement(generateId(), '');

    const cellId = generateId();

    const newLayout: Layout = {
        id: generateId(),
        gridStructure: {
            columns: 1,
            columnWidths: getColumnWidths(1),
            rows: [
                {
                    id: generateId(),
                    cells: [
                        {
                            id: cellId,
                            row: 0,
                            column: 1,
                        },
                    ],
                },
            ],
        },
        type: 'single-column',
        elements: [
            {
                ...newTextEditorElement,
                cellId,
            },
        ],
        style: {},
    };

    return newLayout;
}

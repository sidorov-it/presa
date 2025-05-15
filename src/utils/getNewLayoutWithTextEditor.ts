import getColumnWidths from '@/utils/getColumnWidths';
import { Layout } from '@/types';
import { generateId } from './id';
import { getNewEditorElement } from '@/utils/getNewEditorElement';

export default function getNewLayoutWithTextEditor(
    options: { tempEditor?: boolean; tempLayout?: boolean } = {}
): Layout {
    const cellId = generateId();

    const newTextEditorElement = getNewEditorElement(cellId, '', options);

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
        type: 'blank',
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

import { LayoutType, GridStructure } from '@/types';
import { generateId } from './id';

export const getPredefinedGridStructures = (name: LayoutType): GridStructure => {
    switch (name) {
        case 'blank':
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }],
                    },
                ],
                columnWidths: ['100%'],
            };
        case 'heading':
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }],
                    },
                ],
                columnWidths: ['100%'],
            };
        case 'image-text':
        case 'text-image':
        case 'two-columns-equal':
            return {
                columns: 2,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                        ],
                    },
                ],
                columnWidths: ['50%', '50%'],
            };
        case 'three-columns':
            return {
                columns: 3,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                            { id: generateId(8), row: 1, column: 3 },
                        ],
                    },
                ],
                columnWidths: ['33.33%', '33.34%', '33.33%'],
            };
        case 'four-columns':
            return {
                columns: 4,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                            { id: generateId(8), row: 1, column: 3 },
                            { id: generateId(8), row: 1, column: 4 },
                        ],
                    },
                ],
                columnWidths: ['25%', '25%', '25%', '25%'],
            };
        case 'two-columns-headings':
            return {
                columns: 2,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                        ],
                    },
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 2, column: 1 },
                            { id: generateId(8), row: 2, column: 2 },
                        ],
                    },
                ],
                columnWidths: ['50%', '50%'],
            };
        case 'three-columns-headings':
            return {
                columns: 3,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                            { id: generateId(8), row: 1, column: 3 },
                        ],
                    },
                ],
                columnWidths: ['33.33%', '33.34%', '33.33%'],
            };
        case 'title-bullets':
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }],
                    },
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 2, column: 1 }],
                    },
                ],
                columnWidths: ['100%'],
            };
        case 'title-bullets-image':
            return {
                columns: 2,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                        ],
                    },
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 2, column: 1 },
                            { id: generateId(8), row: 2, column: 2 },
                        ],
                    },
                ],
                columnWidths: ['60%', '40%'],
            };
        case 'accent-left':
        case 'accent-right':
        case 'accent-right-fit':
        case 'accent-left-fit':
            return {
                columns: 2,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                        ],
                    },
                ],
                columnWidths: ['40%', '60%'],
            };
        case 'accent-top':
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }],
                    },
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 2, column: 1 }],
                    },
                ],
                columnWidths: ['100%'],
            };
        case 'accent-background':
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }],
                    },
                ],
                columnWidths: ['100%'],
            };
        case 'two-image-columns':
            return {
                columns: 2,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                        ],
                    },
                ],
                columnWidths: ['50%', '50%'],
            };
        case 'three-image-columns':
            return {
                columns: 3,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                            { id: generateId(8), row: 1, column: 3 },
                        ],
                    },
                ],
                columnWidths: ['33.33%', '33.34%', '33.33%'],
            };
        case 'four-image-columns':
            return {
                columns: 4,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                            { id: generateId(8), row: 1, column: 3 },
                            { id: generateId(8), row: 1, column: 4 },
                        ],
                    },
                ],
                columnWidths: ['25%', '25%', '25%', '25%'],
            };
        case 'images-with-title':
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }], // title
                    },
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 2, column: 1 }], // images (could be grid, but 1 col for now)
                    },
                ],
                columnWidths: ['100%'],
            };
        case 'text-boxes-with-title':
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }], // title
                    },
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 2, column: 1 }], // text boxes (could be grid, but 1 col for now)
                    },
                ],
                columnWidths: ['100%'],
            };
        case 'bar-chart':
        case 'line-chart':
        case 'pie-chart':
        case 'donut-chart':
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }],
                    },
                ],
                columnWidths: ['100%'],
            };
        case 'three-row-table':
            return {
                columns: 3,
                rows: [
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 1, column: 1 },
                            { id: generateId(8), row: 1, column: 2 },
                            { id: generateId(8), row: 1, column: 3 },
                        ],
                    },
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 2, column: 1 },
                            { id: generateId(8), row: 2, column: 2 },
                            { id: generateId(8), row: 2, column: 3 },
                        ],
                    },
                    {
                        id: generateId(8),
                        cells: [
                            { id: generateId(8), row: 3, column: 1 },
                            { id: generateId(8), row: 3, column: 2 },
                            { id: generateId(8), row: 3, column: 3 },
                        ],
                    },
                ],
                columnWidths: ['33.33%', '33.34%', '33.33%'],
            };
        default:
            return {
                columns: 1,
                rows: [
                    {
                        id: generateId(8),
                        cells: [{ id: generateId(8), row: 1, column: 1 }],
                    },
                ],
                columnWidths: ['100%'],
            };
    }
};

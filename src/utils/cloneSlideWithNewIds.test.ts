import { ElementType } from '@/types/elements';
import { cloneSlideWithNewIds } from './cloneSlideWithNewIds';
import { Slide } from '@/types';

describe('cloneSlideWithNewIds', () => {
    const mockSlide: Slide = {
        id: 'slide-1',
        title: 'Test Slide',
        layouts: [
            {
                id: 'layout-1',
                type: 'two-columns-equal',
                style: {},
                elements: [
                    {
                        id: 'element-1',
                        cellId: 'cell-1',
                        elementTypeId: ElementType.TEXT,
                        content: 'Test content',
                    },
                    {
                        id: 'element-2',
                        cellId: 'cell-2',
                        elementTypeId: ElementType.IMAGE,
                        src: 'test.jpg',
                        alt: 'Test image',
                    },
                ],
                gridStructure: {
                    columns: 2,
                    columnWidths: ['50%', '50%'],
                    rows: [
                        {
                            id: 'row-1',
                            cells: [
                                {
                                    id: 'cell-1',
                                    row: 0,
                                    column: 0,
                                },
                                {
                                    id: 'cell-2',
                                    row: 0,
                                    column: 1,
                                },
                            ],
                        },
                    ],
                },
            },
        ],
    };

    it('should create new IDs for all elements while preserving structure', () => {
        const clonedSlide = cloneSlideWithNewIds(mockSlide);

        // Check that all IDs are different
        expect(clonedSlide.id).not.toBe(mockSlide.id);
        expect(clonedSlide.layouts[0].id).not.toBe(mockSlide.layouts[0].id);
        expect(clonedSlide.layouts[0].gridStructure.rows[0].id).not.toBe(mockSlide.layouts[0].gridStructure.rows[0].id);
        expect(clonedSlide.layouts[0].gridStructure.rows[0].cells[0].id).not.toBe(
            mockSlide.layouts[0].gridStructure.rows[0].cells[0].id
        );
        expect(clonedSlide.layouts[0].gridStructure.rows[0].cells[1].id).not.toBe(
            mockSlide.layouts[0].gridStructure.rows[0].cells[1].id
        );
        expect(clonedSlide.layouts[0].elements[0].id).not.toBe(mockSlide.layouts[0].elements[0].id);
        expect(clonedSlide.layouts[0].elements[1].id).not.toBe(mockSlide.layouts[0].elements[1].id);
    });

    it('should preserve cell-element relationships', () => {
        const clonedSlide = cloneSlideWithNewIds(mockSlide);

        // Get the new cell IDs
        const newCellIds = clonedSlide.layouts[0].gridStructure.rows[0].cells.map(cell => cell.id);

        // Check that elements reference the correct new cell IDs
        expect(newCellIds).toContain(clonedSlide.layouts[0].elements[0].cellId);
        expect(newCellIds).toContain(clonedSlide.layouts[0].elements[1].cellId);
    });

    it('should preserve all other data', () => {
        const clonedSlide = cloneSlideWithNewIds(mockSlide);

        // Check that non-ID data is preserved
        expect(clonedSlide.title).toBe(mockSlide.title);
        expect(clonedSlide.layouts[0].type).toBe(mockSlide.layouts[0].type);
        expect(clonedSlide.layouts[0].gridStructure.columns).toBe(mockSlide.layouts[0].gridStructure.columns);
        expect(clonedSlide.layouts[0].gridStructure.columnWidths).toEqual(
            mockSlide.layouts[0].gridStructure.columnWidths
        );
        expect(clonedSlide.layouts[0].elements[0].elementTypeId).toBe(mockSlide.layouts[0].elements[0].elementTypeId);
        expect((clonedSlide.layouts[0].elements[0] as any).content).toBe(
            (mockSlide.layouts[0].elements[0] as any).content
        );
    });

    it('should handle SmartLayoutElement items', () => {
        const slideWithSmartLayout: Slide = {
            id: 'slide-smart',
            title: 'Smart Layout Slide',
            layouts: [
                {
                    id: 'layout-smart',
                    type: 'blank',
                    style: {},
                    elements: [
                        {
                            id: 'smart-element',
                            cellId: 'cell-smart',
                            elementTypeId: ElementType.SMART_LAYOUT,
                            elementVariant: 'bullets',
                            items: [
                                { id: 'item-1', content: 'Item 1' },
                                { id: 'item-2', content: 'Item 2' },
                            ],
                            columnSize: 2,
                            align: 'left',
                            imageShape: 'rectangle',
                            imageSize: 100,
                        },
                    ],
                    gridStructure: {
                        columns: 1,
                        columnWidths: ['100%'],
                        rows: [
                            {
                                id: 'row-smart',
                                cells: [
                                    {
                                        id: 'cell-smart',
                                        row: 0,
                                        column: 0,
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        };

        const clonedSlide = cloneSlideWithNewIds(slideWithSmartLayout);
        const smartElement = clonedSlide.layouts[0].elements[0] as any;

        // Check that SmartLayoutElement items have new IDs
        expect(smartElement.items[0].id).not.toBe('item-1');
        expect(smartElement.items[1].id).not.toBe('item-2');

        // Check that content is preserved
        expect(smartElement.items[0].content).toBe('Item 1');
        expect(smartElement.items[1].content).toBe('Item 2');
    });
});

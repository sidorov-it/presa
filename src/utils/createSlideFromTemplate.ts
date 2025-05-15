import { SlideTemplateConfig, Slide, Layout, LayoutType, GridCell, BaseElement } from '@/types';
import getColumnWidths from './getColumnWidths';
import { getNewElement } from './getNewElement';
import { generateId } from './id';

/**
 * Creates a new slide from a template configuration
 * @param presentationId - The ID of the presentation
 * @param slideIndex - Where to insert the new slide (optional, adds to the end if not specified)
 * @param templateConfig - The template configuration from menuRegistry
 * @returns The ID of the newly created slide
 */
export const createSlideFromTemplate = (templateConfig: SlideTemplateConfig): Slide => {
    // Create a new slide
    const newSlideId = generateId();

    const newSlide: Slide = {
        id: newSlideId,
        layouts: [],
    };

    // Process each layout in the template
    templateConfig.layouts.forEach(layoutConfig => {
        // Create a new layout
        const newLayout: Layout = {
            id: generateId(),
            type: layoutConfig.layout as LayoutType,
            elements: [],
            style: {},
            gridStructure: {
                rows: [
                    {
                        id: generateId(),
                        cells: [],
                    },
                ],
                columns: 0,
                columnWidths: [],
            },
        };

        // Create cells based on the number of elements
        const { columnsCount } = layoutConfig;

        newLayout.gridStructure.columns = columnsCount;
        newLayout.gridStructure.columnWidths = getColumnWidths(columnsCount);

        // Create cells for the layout
        for (let i = 0; i < columnsCount; i++) {
            const cell: GridCell = {
                id: generateId(),
                row: 0,
                column: i,
            };

            newLayout.gridStructure.rows[0].cells.push(cell);

            const cellElements = layoutConfig.elements.filter(element => element.column === i);

            cellElements.forEach(element => {
                const elementConfig = element;
                const newElement = getNewElement({
                    elementTypeId: elementConfig.elementTypeId,
                    props: elementConfig.props,
                    elementVariant: elementConfig.elementVariant,
                });

                if (newElement) {
                    // Add cell ID to the element
                    newLayout.elements.push({
                        ...newElement,
                        cellId: cell.id,
                    } as BaseElement);
                }
            });
        }

        newSlide.layouts.push(newLayout);
    });

    return newSlide;
};

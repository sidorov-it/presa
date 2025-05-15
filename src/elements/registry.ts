import { generateId } from '@/utils/id';
import {
    type BaseElement,
    type EditorElement,
    type ElementConfig,
    type Layout,
    type GridCell,
    type Element,
    type GridRow,
    type ComponentStructureType,
    type SmartLayoutElement,
    type SmartLayoutItem,
    type Slide,
    type LayoutType,
} from '@/types';
import { elementTypes } from './elementTypes';
import { MenuItem } from '@/types/templates';
import getColumnWidths from '@/utils/getColumnWidths';

export const getNewElement = (menuItem: MenuItem): Omit<BaseElement, 'cellId'> | Layout | null => {
    const { elementTypeId, elementVariant, defaultProps } = menuItem;

    if (menuItem.elementTypeId.startsWith('table')) {
        const tableLayout: Layout = {
            id: generateId(),
            elements: [],
            elementTypeId: menuItem.elementTypeId,
            elementVariant: menuItem.elementVariant,
            gridStructure: {
                rows: menuItem.defaultProps?.rows || 2,
                columns: menuItem.defaultProps?.columns || 2,
                columnWidths: getColumnWidths(menuItem.defaultProps?.columns || 2),
            },
            type: 'table',
            style: {},
            isTable: true,
        };

        const rows: GridRow[] = [];
        const elements: BaseElement[] = [];

        for (let rowIndex = 0; rowIndex < menuItem.defaultProps?.rows; rowIndex++) {
            const cells: GridCell[] = [];

            const row: GridRow = {
                id: generateId(),
                cells: [],
            };

            for (let columnIndex = 0; columnIndex < menuItem.defaultProps?.columns; columnIndex++) {
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
    } else {
        const element = {
            id: generateId(8),
            elementTypeId,
            elementVariant,
            ...defaultProps,
        };

        if (menuItem.elementTypeId === 'smart-layout') {
            (element as SmartLayoutElement).items = menuItem.defaultProps?.items.map((item: SmartLayoutItem) => ({
                ...item,
                id: generateId(),
            }));
        }

        return element as Omit<BaseElement, 'cellId'>;
    }
};

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
        const elementCount = layoutConfig.elements.length;
        newLayout.gridStructure.columns = elementCount;
        newLayout.gridStructure.columnWidths = getColumnWidths(elementCount);

        // Create cells for the layout
        for (let i = 0; i < elementCount; i++) {
            const cell: GridCell = {
                id: generateId(),
                row: 0,
                column: i,
            };

            newLayout.gridStructure.rows[0].cells.push(cell);

            // Create element for this cell
            const elementConfig = layoutConfig.elements[i];
            const newElement = getNewElement({
                elementTypeId: elementConfig.elementTypeId,
                defaultProps: elementConfig.defaultProps,
                elementVariant: elementConfig.elementVariant,
                label: '',
            });

            if (newElement) {
                // Add cell ID to the element
                newLayout.elements.push({
                    ...newElement,
                    cellId: cell.id,
                } as BaseElement);
            }
        }

        newSlide.layouts.push(newLayout);
    });

    return newSlide;
};

// Helper to get appropriate menu based on element and context
export const getElementMenuComponent = (elementId: string) => {
    const elementType = elementTypes[elementId];
    if (!elementType) {
        return {
            MenuComponent: undefined,
            menuDirection: 'bottom',
            menuHeight: undefined,
        };
    }

    return {
        MenuComponent: elementType.MenuComponent,
        menuDirection: 'bottom',
        menuHeight: undefined,
    };
};

const emptyTextElement = elementTypes['text'];

export const getNewEditorElement = (
    cellId: string,
    content?: string,
    options: { tempEditor?: boolean; tempLayout?: boolean } = {}
): EditorElement => {
    const newEditor: EditorElement = {
        id: generateId(),
        content: content || '',
        cellId,
        elementTypeId: emptyTextElement.elementTypeId,
        ...options,
    };

    return newEditor;
};

// Check if an element has text editing capabilities
export const hasTextEditor = (elementId: string): boolean => {
    const elementType = elementTypes[elementId];
    return elementType?.hasTextEditor ?? false;
};

// Check if element uses limited text formatting (like button)
export const hasLimitedTextFormatting = (elementId: string): boolean => {
    const elementType = elementTypes[elementId];
    return elementType?.hasLimitedTextFormatting ?? false;
};

// Get component structure type
export const getComponentStructureType = (elementId: string): ComponentStructureType | undefined => {
    const elementType = elementTypes[elementId];
    return elementType?.componentStructure;
};

export const getElementConfig = (elementId: string): ElementConfig | undefined => {
    const elementType = elementTypes[elementId];
    return elementType;
};

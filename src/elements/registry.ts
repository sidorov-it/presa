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
} from '@/types';
import { elementTypes } from './elementTypes';
import { MenuItem, menuRegistry } from './menuRegistry';
import { getColumnWidths } from '@/components/editor/SlideEditor/SlideEditor';

export const getNewTableLayout = (menuItem: MenuItem): Layout | null => {
    const tableLayout: Layout = {
        id: generateId(),
        elements: [],
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
};

export const getNewElement = (menuItem: MenuItem): Omit<BaseElement, 'cellId'> | Layout | null => {
    const { elementTypeId, defaultProps, ...rest } = menuItem;

    // if (!elementType) {
    //     throw new Error(`Element type ${menuItem.elementTypeId} not found in element types registry`);
    // }

    // Base properties for all elements
    const element = {
        id: generateId(8),
        elementTypeId: menuItem.elementTypeId,
        ...defaultProps,
    };

    if (menuItem.elementTypeId === 'smart-layout') {
        (element as SmartLayoutElement).items = menuItem.defaultProps?.items.map((item: SmartLayoutItem) => ({
            ...item,
            id: generateId(),
        }));
    }
    // Special handling for image elements
    // if (menuItem.elementTypeId === 'image') {
    //     return {
    //         ...baseElement,
    //         type: 'image',
    //         src: menuItem.defaultProps?.src || '',
    //         alt: menuItem.defaultProps?.alt || '',
    //         alignment: menuItem.defaultProps?.alignment || 'center',
    //         width: menuItem.defaultProps?.width || undefined,
    //     } as Omit<ImageElement, 'cellId'>;
    // }

    // // Special handling for chart elements
    // if (menuItem.elementTypeId === 'chart') {
    //     return {
    //         ...baseElement,
    //         type: 'chart',
    //         chartType: menuItem.defaultProps?.chartType || 'bar',
    //         data: menuItem.defaultProps?.data || [],
    //     } as Omit<ChartElement, 'cellId'>;
    // }

    // Return default element with menu item's default props
    return element as Omit<BaseElement, 'cellId'>;
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

export const getNewEditorElement = (cellId: string, content?: string): EditorElement => {
    const newEditor: EditorElement = {
        id: generateId(),
        content: content || '',
        cellId,
        elementTypeId: emptyTextElement.elementTypeId,
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
    // if (!elementType) {
    //     throw new Error(`Element type ${elementId} not found in registry`);
    // }
    return elementType;
};

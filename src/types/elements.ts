// Element type definitions for presentation viewer

/**
 * Enum for element types used in the presentation viewer
 */
export enum ElementType {
    TEXT = 'text',
    QUOTE = 'quote',
    IMAGE = 'image',
    CHART = 'chart',
    SMART_LAYOUT = 'smart-layout',

    BUTTON = 'button',

    TABLE = 'table',
    BOX = 'box',
}

/**
 * Interface for image elements
 */
export interface ImageElement {
    url?: string;
    alt?: string;
}

/**
 * Interface for text elements
 */
export interface TextContentElement {
    content?: string;
}

/**
 * Extension for Element type to include additional properties used in the viewer
 */
export type ViewerElement = {
    backgroundColor?: string;
    borderRadius?: string;
    opacity?: number;
    transform?: string;
    url?: string;
    alt?: string;
    content?: string;
    shapeType?: string;
};

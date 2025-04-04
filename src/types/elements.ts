// Element type definitions for presentation viewer

/**
 * Enum for element types used in the presentation viewer
 */
export enum ElementType {
    TEXT = 'text',
    HEADING = 'heading',
    PARAGRAPH = 'paragraph',
    LIST = 'list',
    IMAGE = 'image',
    DIVIDER = 'divider',
    ICON = 'icon',
    VIDEO = 'video',
    CHART = 'chart',
    BUTTON = 'button',
    EDITOR = 'editor',
    SHAPE = 'shape'
}

/**
 * Interface for shape elements
 */
export interface ShapeElement {
    shapeType: 'rectangle' | 'circle' | 'triangle' | string;
    backgroundColor?: string;
    borderRadius?: string;
    opacity?: number;
    transform?: string;
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
} 
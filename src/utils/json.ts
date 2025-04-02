/**
 * Utility functions for working with JSON data in Prisma
 */

/**
 * Parses a JSON string if needed, returns the original value if it's not a string
 * @param data The data that might be a JSON string
 * @returns The parsed object or the original data
 */
export function parseJsonField<T>(data: unknown): T {
    return typeof data === 'string' ? JSON.parse(data) : data as T;
}

/**
 * Stringifies an object if it's not already a string
 * @param data The data that might need to be stringified
 * @returns A JSON string
 */
export function stringifyJsonField(data: unknown): string {
    return typeof data === 'string' ? data : JSON.stringify(data);
}

/**
 * Transform a presentation object by parsing its slides JSON
 * @param presentation The presentation object with potential JSON string slides
 * @returns The presentation with parsed slides
 */
export function parsePresentation<T extends { slides: unknown }>(presentation: T): T {
    if (!presentation) return presentation;
    
    return {
        ...presentation,
        slides: parseJsonField(presentation.slides)
    };
}

/**
 * Parse an array of presentation objects by parsing their slides JSON
 * @param presentations Array of presentation objects
 * @returns Array of presentations with parsed slides
 */
export function parsePresentations<T extends { slides: unknown }>(presentations: T[]): T[] {
    return presentations.map(parsePresentation);
}

/**
 * Calculate the number of slides in a presentation
 * @param presentation The presentation object or slides data
 * @returns The number of slides
 */
export function getSlidesCount(slidesData: unknown): number {
    const slides = parseJsonField<unknown[]>(slidesData);
    return Array.isArray(slides) ? slides.length : 0;
} 
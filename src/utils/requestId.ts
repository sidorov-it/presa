import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique request ID for tracking related LLM calls
 */
export function generateRequestId(): string {
    return uuidv4();
}

/**
 * Generate a short request ID (first 8 characters of UUID)
 * Useful for display purposes
 */
export function generateShortRequestId(): string {
    return uuidv4().substring(0, 8);
}

/**
 * Validate if a string is a valid UUID format
 */
export function isValidRequestId(requestId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(requestId);
} 
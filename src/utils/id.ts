
/**
 * Generates a unique identifier string
 * @returns {string} A unique identifier string
 */
export const generateId = (length = 16): string => {
    return Math.random().toString(36).substring(2, length)
};


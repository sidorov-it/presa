/**
 * Validates if a string is a valid MongoDB ObjectId
 * ObjectId is a 24-character hexadecimal string
 */
export function isValidObjectId(id: string): boolean {
    // Check if id is a string and has exactly 24 characters
    if (typeof id !== 'string' || id.length !== 24) {
        return false;
    }

    // Check if all characters are valid hexadecimal (0-9, a-f, A-F)
    return /^[a-fA-F0-9]{24}$/.test(id);
}



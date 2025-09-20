import { ImportPresentationResponse } from '@/types';

/**
 * Frontend utility functions for presentation export/import
 */

/**
 * Exports a presentation and triggers download
 */
export const exportPresentation = async (presentationId: string): Promise<void> => {
    try {
        const response = await fetch(`/api/presentations/${presentationId}/export`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Export failed');
        }

        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'presentation_export.json';

        // Create blob and trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};

/**
 * Imports a presentation from a file
 */
export const importPresentation = async (file: File): Promise<ImportPresentationResponse> => {
    try {
        // Validate file type
        if (!file.name.endsWith('.json')) {
            throw new Error('Invalid file type. Only JSON files are supported.');
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Send request
        const response = await fetch('/api/presentations/import', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Import failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Import failed:', error);
        throw error;
    }
};

/**
 * Validates a JSON file before import
 */
export const validateImportFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.name.endsWith('.json')) {
        return { valid: false, error: 'Invalid file type. Only JSON files are supported.' };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return { valid: false, error: 'File too large. Maximum size is 10MB.' };
    }

    return { valid: true };
};

/**
 * Reads and validates JSON file content
 */
export const readAndValidateJsonFile = (file: File): Promise<{ valid: boolean; data?: any; error?: string }> => {
    return new Promise(resolve => {
        const reader = new FileReader();

        reader.onload = e => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!data.presentation || !data.presentation.title || !data.presentation.slides) {
                    resolve({ valid: false, error: 'Invalid presentation data structure' });
                    return;
                }

                resolve({ valid: true, data });
            } catch (error) {
                console.error('Error reading file:', error);
                resolve({ valid: false, error: 'Invalid JSON file' });
            }
        };

        reader.onerror = () => {
            resolve({ valid: false, error: 'Error reading file' });
        };

        reader.readAsText(file);
    });
};

/**
 * Creates a file input element for import
 */
export const createFileInput = (onFileSelect: (file: File) => void): HTMLInputElement => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';

    input.addEventListener('change', e => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            onFileSelect(file);
        }
    });

    return input;
};

/**
 * Triggers file selection dialog
 */
export const selectFileForImport = (): Promise<File | null> => {
    return new Promise(resolve => {
        const input = createFileInput(file => {
            resolve(file);
            document.body.removeChild(input);
        });

        document.body.appendChild(input);
        input.click();

        // Handle cancel
        const handleCancel = () => {
            setTimeout(() => {
                if (document.body.contains(input)) {
                    document.body.removeChild(input);
                    resolve(null);
                }
            }, 100);
        };

        input.addEventListener('cancel', handleCancel);
        window.addEventListener('focus', handleCancel, { once: true });
    });
};

import { ExportPresentationData, IPresentation, Slide } from '@/types';
import { generateId } from '@/utils/id';

/**
 * Creates export data structure from presentation
 */
export const createExportData = (presentation: IPresentation): ExportPresentationData => {
    return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        presentation: {
            title: presentation.title,
            description: presentation.description,
            slides: presentation.slides,
            themeId: presentation.themeId,
            backgroundSettings: presentation.backgroundSettings,
            durationMinutes: presentation.durationMinutes,
            goal: presentation.goal,
            audience: presentation.audience,
            tone: presentation.tone,
        },
    };
};

/**
 * Validates import data structure
 */
export const validateImportData = (data: any): data is ExportPresentationData => {
    if (!data || typeof data !== 'object') {
        return false;
    }

    if (!data.presentation || typeof data.presentation !== 'object') {
        return false;
    }

    const { presentation } = data;

    // Check required fields
    if (!presentation.title || typeof presentation.title !== 'string') {
        return false;
    }

    if (!presentation.slides || !Array.isArray(presentation.slides)) {
        return false;
    }

    // Check if slides have required structure
    for (const slide of presentation.slides) {
        if (!slide.id || !slide.layouts || !Array.isArray(slide.layouts)) {
            return false;
        }
    }

    return true;
};

/**
 * Generates new IDs for all elements in the presentation to avoid conflicts
 */
export const regenerateIds = (slides: Slide[]): Slide[] => {
    return slides.map(slide => {
        const updatedLayouts = [...slide.layouts].map(layout => {
            const updatedElements = [...layout.elements];

            const updatedGridStructure = {
                ...layout.gridStructure,
                rows: layout.gridStructure.rows.map(row => {
                    return {
                        ...row,
                        cells: row.cells.map(cell => {
                            const cellId = generateId();
                            updatedElements.forEach(element => {
                                if (element.cellId === cell.id) {
                                    element.cellId = cellId;
                                }
                            });
                            return { ...cell, id: cellId };
                        }),
                    };
                }),
            };

            return { ...layout, elements: updatedElements, gridStructure: updatedGridStructure };
        });
        slide.layouts = updatedLayouts;
        return slide;
    });
};

/**
 * Creates a safe filename from presentation title
 */
export const createSafeFilename = (title: string): string => {
    return `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_export.json`;
};

/**
 * Checks if the import data version is supported
 */
export const isVersionSupported = (version: string): boolean => {
    const supportedVersions = ['1.0'];
    return supportedVersions.includes(version);
};

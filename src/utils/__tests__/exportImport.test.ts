import { 
    createExportData, 
    validateImportData, 
    regenerateIds, 
    createSafeFilename, 
    isVersionSupported 
} from '../exportImport';
import { IPresentation } from '@/types';

describe('exportImport utilities', () => {
    const mockPresentation: IPresentation = {
        id: 'test-id',
        title: 'Test Presentation',
        description: 'Test description',
        slides: [
            {
                id: 'slide-1',
                layouts: [
                    {
                        id: 'layout-1',
                        elements: [
                            {
                                id: 'element-1',
                                cellId: 'cell-1',
                                elementTypeId: 'text',
                                content: 'Test content'
                            }
                        ],
                        gridStructure: {
                            rows: [
                                {
                                    id: 'row-1',
                                    cells: [
                                        {
                                            id: 'cell-1',
                                            row: 0,
                                            column: 0
                                        }
                                    ]
                                }
                            ],
                            columns: 1,
                            columnWidths: ['100%']
                        },
                        style: {}
                    }
                ]
            }
        ],
        themeId: 'theme-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        durationMinutes: 30,
        goal: 'Test goal',
        audience: 'Test audience',
        tone: 'Professional'
    };

    describe('createExportData', () => {
        it('should create valid export data structure', () => {
            const exportData = createExportData(mockPresentation);

            expect(exportData.version).toBe('1.0');
            expect(exportData.exportedAt).toBeDefined();
            expect(exportData.presentation.title).toBe('Test Presentation');
            expect(exportData.presentation.slides).toHaveLength(1);
            expect(exportData.presentation.themeId).toBe('theme-1');
        });

        it('should include all presentation fields', () => {
            const exportData = createExportData(mockPresentation);

            expect(exportData.presentation.description).toBe('Test description');
            expect(exportData.presentation.durationMinutes).toBe(30);
            expect(exportData.presentation.goal).toBe('Test goal');
            expect(exportData.presentation.audience).toBe('Test audience');
            expect(exportData.presentation.tone).toBe('Professional');
        });
    });

    describe('validateImportData', () => {
        it('should validate correct import data', () => {
            const validData = {
                version: '1.0',
                exportedAt: '2024-01-01T00:00:00.000Z',
                presentation: {
                    title: 'Test',
                    slides: [
                        {
                            id: 'slide-1',
                            layouts: []
                        }
                    ]
                }
            };

            expect(validateImportData(validData)).toBe(true);
        });

        it('should reject invalid data structure', () => {
            expect(validateImportData(null)).toBe(false);
            expect(validateImportData({})).toBe(false);
            expect(validateImportData({ presentation: {} })).toBe(false);
            expect(validateImportData({ presentation: { title: 'Test' } })).toBe(false);
        });

        it('should reject data with invalid slides', () => {
            const invalidData = {
                presentation: {
                    title: 'Test',
                    slides: [
                        { id: 'slide-1' } // missing layouts
                    ]
                }
            };

            expect(validateImportData(invalidData)).toBe(false);
        });
    });

    describe('regenerateIds', () => {
        it('should regenerate all IDs in nested structure', () => {
            const original = {
                id: 'original-id',
                cellId: 'original-cell-id',
                nested: {
                    id: 'nested-id',
                    items: [
                        { id: 'item-1' },
                        { id: 'item-2', cellId: 'cell-2' }
                    ]
                }
            };

            const regenerated = regenerateIds(original);

            expect(regenerated.id).not.toBe('original-id');
            expect(regenerated.cellId).not.toBe('original-cell-id');
            expect(regenerated.nested.id).not.toBe('nested-id');
            expect(regenerated.nested.items[0].id).not.toBe('item-1');
            expect(regenerated.nested.items[1].id).not.toBe('item-2');
            expect(regenerated.nested.items[1].cellId).not.toBe('cell-2');
        });

        it('should handle arrays correctly', () => {
            const original = [
                { id: 'item-1' },
                { id: 'item-2' }
            ];

            const regenerated = regenerateIds(original);

            expect(Array.isArray(regenerated)).toBe(true);
            expect(regenerated[0].id).not.toBe('item-1');
            expect(regenerated[1].id).not.toBe('item-2');
        });

        it('should preserve non-id properties', () => {
            const original = {
                id: 'test-id',
                title: 'Test Title',
                content: 'Test Content',
                number: 42
            };

            const regenerated = regenerateIds(original);

            expect(regenerated.title).toBe('Test Title');
            expect(regenerated.content).toBe('Test Content');
            expect(regenerated.number).toBe(42);
        });
    });

    describe('createSafeFilename', () => {
        it('should create safe filename from title', () => {
            expect(createSafeFilename('My Presentation')).toBe('My_Presentation_export.json');
            expect(createSafeFilename('Test/Title\\With:Special*Characters')).toBe('TestTitleWithSpecialCharacters_export.json');
            expect(createSafeFilename('Multiple   Spaces')).toBe('Multiple_Spaces_export.json');
        });

        it('should handle empty or special titles', () => {
            expect(createSafeFilename('')).toBe('_export.json');
            expect(createSafeFilename('!@#$%^&*()')).toBe('_export.json');
        });
    });

    describe('isVersionSupported', () => {
        it('should support version 1.0', () => {
            expect(isVersionSupported('1.0')).toBe(true);
        });

        it('should not support other versions', () => {
            expect(isVersionSupported('2.0')).toBe(false);
            expect(isVersionSupported('0.9')).toBe(false);
            expect(isVersionSupported('1.1')).toBe(false);
        });
    });
}); 
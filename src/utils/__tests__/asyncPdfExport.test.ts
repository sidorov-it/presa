import { startPdfExport, checkPdfExportStatus } from '../asyncPdfExport';
import { SINGLE_PAGE_TEST_STRATEGY } from '@/types/pdfExport';

// Mock fetch globally
global.fetch = jest.fn();

describe('asyncPdfExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('startPdfExport', () => {
        it('should start PDF export and return task ID', async () => {
            const mockResponse = {
                ok: true,
                json: async () => ({ taskId: 'test-task-id', message: 'PDF generation started' }),
            };

            (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            const taskId = await startPdfExport('test-presentation-id');

            expect(fetch).toHaveBeenCalledWith('/api/presentations/test-presentation-id/export/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            expect(taskId).toBe('test-task-id');
        });

        it('should start PDF export with slide index', async () => {
            const mockResponse = {
                ok: true,
                json: async () => ({ taskId: 'test-task-id', message: 'PDF generation started' }),
            };

            (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            const taskId = await startPdfExport('test-presentation-id', 2);

            expect(fetch).toHaveBeenCalledWith('/api/presentations/test-presentation-id/export/pdf?slideIndex=2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            expect(taskId).toBe('test-task-id');
        });

        it('should start PDF export with experimental strategy', async () => {
            const mockResponse = {
                ok: true,
                json: async () => ({ taskId: 'test-task-id', message: 'PDF generation started' }),
            };

            (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            const taskId = await startPdfExport('test-presentation-id', { strategy: SINGLE_PAGE_TEST_STRATEGY });

            expect(fetch).toHaveBeenCalledWith(
                '/api/presentations/test-presentation-id/export/pdf?strategy=single-page-test',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            expect(taskId).toBe('test-task-id');
        });

        it('should throw error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                json: async () => ({ error: 'Test error' }),
            };

            (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            await expect(startPdfExport('test-presentation-id')).rejects.toThrow('Test error');
        });
    });

    describe('checkPdfExportStatus', () => {
        it('should check PDF export status', async () => {
            const mockStatus = {
                status: 'in_progress',
                progress: 50,
                message: 'Processing...',
                totalSlides: 10,
                completedSlides: 5,
            };

            const mockResponse = {
                ok: true,
                json: async () => mockStatus,
            };

            (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            const status = await checkPdfExportStatus('test-presentation-id', 'test-task-id');

            expect(fetch).toHaveBeenCalledWith(
                '/api/presentations/test-presentation-id/export/pdf/status?taskId=test-task-id'
            );

            expect(status).toEqual(mockStatus);
        });

        it('should throw error when status check fails', async () => {
            const mockResponse = {
                ok: false,
                json: async () => ({ error: 'Task not found' }),
            };

            (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            await expect(checkPdfExportStatus('test-presentation-id', 'test-task-id')).rejects.toThrow(
                'Task not found'
            );
        });
    });
});

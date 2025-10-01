import { DEFAULT_PDF_EXPORT_STRATEGY, PdfExportStrategy } from '@/types/pdfExport';

export interface PdfExportProgress {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    message: string;
    totalSlides: number;
    completedSlides: number;
    downloadUrl?: string;
    fileName?: string;
    error?: string;
}

export interface PdfExportResult {
    success: boolean;
    downloadUrl?: string;
    fileName?: string;
    error?: string;
}

export interface StartPdfExportOptions {
    slideIndex?: number;
    strategy?: PdfExportStrategy;
}

const buildStartPdfExportUrl = (presentationId: string, options?: StartPdfExportOptions): string => {
    const searchParams = new URLSearchParams();

    if (options?.slideIndex !== undefined) {
        searchParams.set('slideIndex', String(options.slideIndex));
    }

    if (options?.strategy && options.strategy !== DEFAULT_PDF_EXPORT_STRATEGY) {
        searchParams.set('strategy', options.strategy);
    }

    const query = searchParams.toString();
    return `/api/presentations/${presentationId}/export/pdf${query ? `?${query}` : ''}`;
};

export const startPdfExport = async (
    presentationId: string,
    optionsOrSlideIndex?: number | StartPdfExportOptions
): Promise<string> => {
    let options: StartPdfExportOptions | undefined;

    if (typeof optionsOrSlideIndex === 'number') {
        options = { slideIndex: optionsOrSlideIndex };
    } else {
        options = optionsOrSlideIndex;
    }

    const url = buildStartPdfExportUrl(presentationId, options);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start PDF export');
    }

    const result = await response.json();
    return result.taskId;
};

export const checkPdfExportStatus = async (presentationId: string, taskId: string): Promise<PdfExportProgress> => {
    const response = await fetch(`/api/presentations/${presentationId}/export/pdf/status?taskId=${taskId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check export status');
    }

    return await response.json();
};

export type ExportPresentationToPdfOptions = StartPdfExportOptions;

export const exportPresentationToPdfAsync = async (
    presentationId: string,
    optionsOrSlideIndex?: number | ExportPresentationToPdfOptions | ((progress: PdfExportProgress) => void),
    onProgress?: (progress: PdfExportProgress) => void
): Promise<PdfExportResult> => {
    try {
        let startOptions: StartPdfExportOptions | undefined;
        let progressCallback: ((progress: PdfExportProgress) => void) | undefined = onProgress;

        if (typeof optionsOrSlideIndex === 'number') {
            startOptions = { slideIndex: optionsOrSlideIndex };
        } else if (typeof optionsOrSlideIndex === 'function') {
            progressCallback = optionsOrSlideIndex;
        } else if (optionsOrSlideIndex) {
            startOptions = optionsOrSlideIndex;
        }

        if (typeof onProgress === 'function') {
            progressCallback = onProgress;
        }

        // Start export
        const taskId = await startPdfExport(presentationId, startOptions);

        // Poll for status
        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                try {
                    const status = await checkPdfExportStatus(presentationId, taskId);

                    // Call progress callback if provided
                    if (progressCallback) {
                        progressCallback(status);
                    }

                    if (status.status === 'completed') {
                        clearInterval(pollInterval);
                        resolve({
                            success: true,
                            downloadUrl: status.downloadUrl,
                            fileName: status.fileName,
                        });
                    } else if (status.status === 'failed') {
                        clearInterval(pollInterval);
                        resolve({
                            success: false,
                            error: status.error || 'Export failed',
                        });
                    }
                    // Continue polling for 'pending' and 'in_progress'
                } catch (error) {
                    clearInterval(pollInterval);
                    reject(error);
                }
            }, 2000); // Poll every 2 seconds

            // Set timeout to prevent infinite polling
            setTimeout(
                () => {
                    clearInterval(pollInterval);
                    reject(new Error('Export timeout - please try again'));
                },
                5 * 60 * 1000
            ); // 5 minutes timeout
        });
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

export const downloadPdfFile = (downloadUrl: string, fileName: string = 'presentation.pdf') => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

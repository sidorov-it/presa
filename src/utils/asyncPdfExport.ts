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

export type PdfExportStrategy = 'per-slide' | 'single-page-test';

interface StartPdfExportOptions {
    slideIndex?: number;
    strategy?: PdfExportStrategy;
}

interface ExportOptions {
    slideIndex?: number;
    strategy?: PdfExportStrategy;
    onProgress?: (progress: PdfExportProgress) => void;
}

export const startPdfExport = async (presentationId: string, options: StartPdfExportOptions = {}): Promise<string> => {
    const searchParams = new URLSearchParams();

    if (typeof options.slideIndex === 'number') {
        searchParams.set('slideIndex', options.slideIndex.toString());
    }

    if (options.strategy && options.strategy !== 'per-slide') {
        searchParams.set('strategy', options.strategy);
    }

    const queryString = searchParams.toString();
    const url = `/api/presentations/${presentationId}/export/pdf${queryString ? `?${queryString}` : ''}`;

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

export const exportPresentationToPdfAsync = async (
    presentationId: string,
    slideIndexOrOptions?: number | ExportOptions,
    onProgress?: (progress: PdfExportProgress) => void
): Promise<PdfExportResult> => {
    let slideIndex: number | undefined;
    let strategy: PdfExportStrategy | undefined;
    let progressCallback: ((progress: PdfExportProgress) => void) | undefined = onProgress;

    if (typeof slideIndexOrOptions === 'object' && slideIndexOrOptions !== null) {
        slideIndex = slideIndexOrOptions.slideIndex;
        strategy = slideIndexOrOptions.strategy;
        progressCallback = slideIndexOrOptions.onProgress ?? onProgress;
    } else {
        slideIndex = slideIndexOrOptions;
    }

    try {
        // Start export
        const taskId = await startPdfExport(presentationId, {
            slideIndex,
            strategy,
        });

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

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

export const startPdfExport = async (presentationId: string, slideIndex?: number): Promise<string> => {
    const url = `/api/presentations/${presentationId}/export/pdf${slideIndex !== undefined ? `?slideIndex=${slideIndex}` : ''}`;

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
    slideIndex?: number,
    onProgress?: (progress: PdfExportProgress) => void
): Promise<PdfExportResult> => {
    try {
        // Start export
        const taskId = await startPdfExport(presentationId, slideIndex);

        // Poll for status
        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                try {
                    const status = await checkPdfExportStatus(presentationId, taskId);

                    // Call progress callback if provided
                    if (onProgress) {
                        onProgress(status);
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

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { exportPresentationToPdfAsync, downloadPdfFile, PdfExportProgress } from '@/utils/asyncPdfExport';

interface PdfExportButtonProps {
    presentationId: string;
    presentationTitle?: string;
    className?: string;
    slideIndex?: number;
}

const PdfExportButton: React.FC<PdfExportButtonProps> = ({ presentationId, className = '', slideIndex }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<PdfExportProgress | null>(null);

    const handleExportToPdf = async () => {
        if (!presentationId) {
            toast.error('Presentation ID is required');
            return;
        }

        setIsExporting(true);
        setExportProgress(null);

        // Создаем toast и сохраняем его ID для обновления
        const toastId = toast.loading('Начинаем генерацию PDF...');

        try {
            const result = await exportPresentationToPdfAsync(presentationId, slideIndex, progress => {
                setExportProgress(progress);

                // Обновляем toast с новым прогрессом
                toast.loading(`${progress.message} (${progress.progress}%)`, { id: toastId });
            });

            if (result.success) {
                if (result.downloadUrl && result.fileName) {
                    // Автоматически скачиваем файл
                    downloadPdfFile(result.downloadUrl, result.fileName);
                    toast.success('PDF успешно сгенерирован и скачан', { id: toastId });
                } else {
                    toast.success('PDF сгенерирован успешно', { id: toastId });
                }
            } else {
                throw new Error(result.error || 'Export failed');
            }
        } catch (error) {
            console.error('PDF export error:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Ошибка при экспорте: ${errorMessage}`, { id: toastId });
        } finally {
            setIsExporting(false);
            setExportProgress(null);
        }
    };

    const getButtonText = () => {
        if (isExporting && exportProgress) {
            return `${exportProgress.message} (${exportProgress.progress}%)`;
        }
        if (isExporting) {
            return 'Начинаем экспорт...';
        }
        return slideIndex !== undefined ? `Экспорт слайда ${slideIndex + 1}` : 'Экспорт PDF';
    };

    return (
        <div style={{ position: 'relative' }}>
            <Button
                onClick={handleExportToPdf}
                disabled={isExporting}
                className={className}
                type="button"
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minWidth: '140px',
                }}
            >
                {getButtonText()}

                {/* Прогресс-бар внизу кнопки */}
                {isExporting && exportProgress && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                transition: 'width 0.3s ease',
                                width: `${exportProgress.progress}%`,
                            }}
                        />
                    </div>
                )}
            </Button>
        </div>
    );
};

export default PdfExportButton;

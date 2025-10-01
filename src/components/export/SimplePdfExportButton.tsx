import React, { useState } from 'react';
import { LuDownload, LuLoader } from 'react-icons/lu';
import Tooltip from '@/components/tooltip/Tooltip';
import styles from './SimplePdfExportButton.module.css';
import { toast } from 'sonner';
import {
    exportPresentationToPdfAsync,
    downloadPdfFile,
    PdfExportProgress,
    PdfExportStrategy,
} from '@/utils/asyncPdfExport';

interface SimplePdfExportButtonProps {
    presentationId: string;
    className?: string;
    slideIndex?: number;
    exportStrategy?: PdfExportStrategy;
}

const SimplePdfExportButton: React.FC<SimplePdfExportButtonProps> = ({
    presentationId,
    slideIndex,
    exportStrategy,
}) => {
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
            const result = await exportPresentationToPdfAsync(presentationId, {
                slideIndex,
                strategy: exportStrategy,
                onProgress: progress => {
                    setExportProgress(progress);

                    // Обновляем toast с новым прогрессом
                    toast.loading(`Создаем pdf ${progress.progress}%`, { id: toastId });
                },
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

    const getTooltipContent = () => {
        if (isExporting && exportProgress) {
            return `${exportProgress.message} (${exportProgress.progress}%)`;
        }
        return slideIndex !== undefined ? `Скачать слайд ${slideIndex + 1}` : 'Скачать презентацию';
    };

    return (
        <div className={styles.container}>
            <Tooltip content={getTooltipContent()}>
                <button
                    className={styles.downloadButton}
                    onClick={handleExportToPdf}
                    aria-label={slideIndex !== undefined ? `Скачать слайд ${slideIndex + 1}` : 'Скачать презентацию'}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <LuLoader aria-hidden="true" className={styles.spinner} />
                    ) : (
                        <LuDownload className={styles.downloadIcon} aria-hidden="true" />
                    )}

                    {/* Прогресс-бар */}
                    {isExporting && exportProgress && (
                        <div className={styles.progressContainer}>
                            <div className={styles.progressBar} style={{ width: `${exportProgress.progress}%` }} />
                        </div>
                    )}
                </button>
            </Tooltip>

            {/* Дополнительный текст с прогрессом */}
            {isExporting && exportProgress && <div className={styles.exportingText}>{exportProgress.progress}%</div>}
        </div>
    );
};

export default SimplePdfExportButton;

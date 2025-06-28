import React, { useCallback, useState } from 'react';
import { LuDownload, LuLoader } from 'react-icons/lu';
import { Tooltip } from '@/components/ui/tooltip';
import styles from './SimplePdfExportButton.module.css';
import { toast } from 'sonner';

interface SimplePdfExportButtonProps {
    presentationId: string;
    presentationTitle?: string;
    className?: string;
}

const SimplePdfExportButton: React.FC<SimplePdfExportButtonProps> = ({
    presentationId,
    // presentationTitle = 'presentation',
}) => {
    const [isExporting, setIsExporting] = useState(false);

    const exportPresentationToPdf = useCallback(async (presentationId: string) => {
        const presentationTitle = 'presentation';
        return new Promise((resolve, reject) => {
            try {
                fetch(`/api/presentations/${presentationId}/export/pdf`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                    .then(response => {
                        if (!response.ok) {
                            response.json().then(error => {
                                throw new Error(error.error || 'Failed to export PDF');
                            });
                        }

                        response
                            .blob()
                            .then(pdfBlob => {
                                const url = window.URL.createObjectURL(pdfBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${presentationTitle}.pdf`;

                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);

                                resolve(true);
                            })
                            .catch(error => {
                                reject(error);
                            });
                    })
                    .catch(error => {
                        reject(error);
                    });
            } catch (error) {
                reject(error);
            }
        });
    }, []);

    const handleExportToPdf = async () => {
        if (!presentationId) {
            alert('Presentation ID is required');
            return;
        }

        setIsExporting(true);

        try {
            const exportPromise = exportPresentationToPdf(presentationId);

            toast.promise(exportPromise, {
                loading: 'Подготавливаем PDF для скачивания. Пожалуйста, не закрывайте эту страницу.',
                success: () => {
                    setIsExporting(false);
                    return 'Презентация успешно экспортирована в PDF';
                },
                error: err => {
                    console.error('Error exporting presentation to PDF:', err);
                    setIsExporting(false);
                    return 'Произошла ошибка при экспорте. Попробуйте еще раз.';
                },
            });
        } catch (error) {
            console.error('PDF export error:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Tooltip content="Скачать">
            <button
                onClick={handleExportToPdf}
                // className={styles.downloadButton}
                aria-label="Скачать презентацию"
                disabled={isExporting}
            >
                {isExporting ? (
                    <LuLoader aria-hidden="true" className={styles.spinner} />
                ) : (
                    <LuDownload className={styles.downloadIcon} aria-hidden="true" />
                )}
            </button>
        </Tooltip>
    );
};

export default SimplePdfExportButton;

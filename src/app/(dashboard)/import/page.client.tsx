'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { importPresentation, validateImportFile, readAndValidateJsonFile } from '@/utils/presentationExportImport';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/heading';
import { FaUpload, FaFileAlt, FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import styles from './page.module.css';

export default function ImportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        error?: string;
        data?: any;
    } | null>(null);
    const [importResult, setImportResult] = useState<{
        success: boolean;
        message: string;
        presentationId?: string;
    } | null>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setValidationResult(null);
        setImportResult(null);

        // Validate file
        const validation = validateImportFile(file);
        if (!validation.valid) {
            setValidationResult({ valid: false, error: validation.error });
            return;
        }

        // Read and validate JSON content
        const jsonValidation = await readAndValidateJsonFile(file);
        setValidationResult(jsonValidation);
    };

    const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (!file) return;

        setSelectedFile(file);
        setValidationResult(null);
        setImportResult(null);

        // Validate file
        const validation = validateImportFile(file);
        if (!validation.valid) {
            setValidationResult({ valid: false, error: validation.error });
            return;
        }

        // Read and validate JSON content
        const jsonValidation = await readAndValidateJsonFile(file);
        setValidationResult(jsonValidation);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleImport = async () => {
        if (!selectedFile || !validationResult?.valid) return;

        setIsLoading(true);
        try {
            const result = await importPresentation(selectedFile);
            setImportResult({
                success: true,
                message: result.message,
                presentationId: result.presentation.id,
            });
        } catch (error) {
            setImportResult({
                success: false,
                message: error instanceof Error ? error.message : 'Ошибка импорта',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenFileDialog = () => {
        fileInputRef.current?.click();
    };

    const handleReset = () => {
        setSelectedFile(null);
        setValidationResult(null);
        setImportResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleOpenImportedPresentation = () => {
        if (importResult?.presentationId) {
            router.push(`/docs/${importResult.presentationId}`);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/dashboard" className={styles.backLink}>
                    <FaArrowLeft />
                    <span>Назад к презентациям</span>
                </Link>
                <Heading level={1} className={styles.title}>
                    Импорт презентации
                </Heading>
            </div>

            <div className={styles.content}>
                {!importResult?.success ? (
                    <>
                        <div className={styles.description}>
                            <p>
                                Загрузите файл экспортированной презентации в формате JSON. 
                                Презентация будет добавлена в ваш список с пометкой "(Imported)".
                            </p>
                        </div>

                        <div
                            className={`${styles.dropZone} ${
                                selectedFile ? styles.hasFile : ''
                            } ${validationResult?.valid ? styles.valid : ''} ${
                                validationResult?.valid === false ? styles.invalid : ''
                            }`}
                            onDrop={handleFileDrop}
                            onDragOver={handleDragOver}
                            onClick={handleOpenFileDialog}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                className={styles.fileInput}
                            />

                            <div className={styles.dropZoneContent}>
                                {!selectedFile ? (
                                    <>
                                        <FaUpload className={styles.uploadIcon} />
                                        <p className={styles.dropZoneText}>
                                            Перетащите файл сюда или нажмите для выбора
                                        </p>
                                        <p className={styles.dropZoneSubtext}>
                                            Поддерживаются только файлы .json
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <FaFileAlt className={styles.fileIcon} />
                                        <p className={styles.fileName}>{selectedFile.name}</p>
                                        <p className={styles.fileSize}>
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </>
                                )}
                            </div>

                            {validationResult && (
                                <div className={`${styles.validationStatus} ${
                                    validationResult.valid ? styles.valid : styles.invalid
                                }`}>
                                    {validationResult.valid ? (
                                        <>
                                            <FaCheck />
                                            <span>Файл валиден</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaTimes />
                                            <span>{validationResult.error}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {validationResult?.valid && (
                            <div className={styles.preview}>
                                <h3>Предварительный просмотр:</h3>
                                <div className={styles.previewContent}>
                                    <p><strong>Название:</strong> {validationResult.data.presentation.title}</p>
                                    {validationResult.data.presentation.description && (
                                        <p><strong>Описание:</strong> {validationResult.data.presentation.description}</p>
                                    )}
                                    <p><strong>Слайдов:</strong> {validationResult.data.presentation.slides.length}</p>
                                    {validationResult.data.presentation.durationMinutes && (
                                        <p><strong>Длительность:</strong> {validationResult.data.presentation.durationMinutes} мин.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <Button
                                onClick={handleImport}
                                disabled={!validationResult?.valid || isLoading}
                                className={styles.importButton}
                            >
                                {isLoading ? 'Импорт...' : 'Импортировать презентацию'}
                            </Button>

                            {selectedFile && (
                                <Button
                                    onClick={handleReset}
                                    variant="secondary"
                                    className={styles.resetButton}
                                >
                                    Выбрать другой файл
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className={styles.successMessage}>
                        <div className={styles.successIcon}>
                            <FaCheck />
                        </div>
                        <h2>Презентация успешно импортирована!</h2>
                        <p>{importResult.message}</p>
                        
                        <div className={styles.successActions}>
                            <Button
                                onClick={handleOpenImportedPresentation}
                                className={styles.openButton}
                            >
                                Открыть презентацию
                            </Button>
                            <Button
                                onClick={() => router.push('/dashboard')}
                                variant="secondary"
                                className={styles.backToDashboardButton}
                            >
                                Вернуться к списку
                            </Button>
                        </div>
                    </div>
                )}

                {importResult && !importResult.success && (
                    <div className={styles.errorMessage}>
                        <div className={styles.errorIcon}>
                            <FaTimes />
                        </div>
                        <h3>Ошибка импорта</h3>
                        <p>{importResult.message}</p>
                        <Button
                            onClick={handleReset}
                            variant="secondary"
                            className={styles.tryAgainButton}
                        >
                            Попробовать снова
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
} 
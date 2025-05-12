'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiLoader } from 'react-icons/fi';

import styles from './ImageEditBox.module.css';
import { Button } from '@/components/ui/Button';
import { useMenuStore } from '@/store/menuStore';

interface ImageEditBoxProps {
    imageUrl: string;
    onClearImage: () => void;
    onUpdateLink: (link: string, uploaded: boolean) => void;
    // presentationId: string;
    // slideId: string;
    // layoutId: string;
    // elementId: string;
}

const ImageEditBox: React.FC<ImageEditBoxProps> = ({ imageUrl, onClearImage, onUpdateLink }) => {
    const [imageUrlLocal, setImageUrlLocal] = useState(imageUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                setIsLoading(true);
                setError('');

                const formData = new FormData();
                formData.append('file', acceptedFiles[0]);

                fetch('/api/assets/upload', {
                    method: 'POST',
                    body: formData,
                })
                    .then(async response => {
                        if (!response.ok) {
                            throw new Error('Не удалось загрузить изображение');
                        }
                        const data = await response.json();
                        onUpdateLink(data.url, true);
                        setImageUrlLocal(data.url);
                        setError('');
                    })
                    .catch(err => {
                        setError(err instanceof Error ? err.message : 'Не удалось загрузить изображение');
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            }
        },
        [onUpdateLink]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        },
        disabled: isLoading,
    });

    const handleUpdateLink = async (link: string) => {
        if (!link) {
            setImageUrlLocal('');
            onUpdateLink('', false);
            return;
        }

        try {
            // Check if URL is from external domain
            const url = new URL(link);
            const isExternalUrl = !url.hostname.includes(window.location.hostname);

            if (isExternalUrl) {
                setIsLoading(true);
                setError('');

                // Fetch the image as blob
                const imageResponse = await fetch(link);
                if (!imageResponse.ok) {
                    throw new Error('Не удалось загрузить изображение');
                }

                const blob = await imageResponse.blob();
                const formData = new FormData();
                formData.append('file', blob, 'image.' + blob.type.split('/')[1]);

                const response = await fetch('/api/assets/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Не удалось сохранить изображение');
                }

                const data = await response.json();
                onUpdateLink(data.url, true);
                setImageUrlLocal(data.url);
                setError('');
            } else {
                // Local URL, use as is
                onUpdateLink(link, false);
                setImageUrlLocal(link);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Не удалось загрузить изображение');
            // Keep the old URL if there was an error
            setImageUrlLocal(imageUrl);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReplaceImageClick = useCallback(() => {
        onClearImage();
        setImageUrlLocal('');
        setError('');
    }, [onClearImage]);

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Редактирование изображения</h3>
            <div className={styles.closeButton}>
                <Button variant="outline" size="sm" onClick={() => useMenuStore.getState().closeSideMenu()}>
                    X
                </Button>
            </div>

            <div className={styles.inputGroup}>
                <label htmlFor="imageUrl" className={styles.label}>
                    Ссылка на изображение
                </label>
                <input
                    id="imageUrl"
                    type="url"
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    value={imageUrlLocal || ''}
                    onChange={e => handleUpdateLink(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    disabled={isLoading}
                />
                {error && <div className={styles.error}>{error}</div>}
            </div>

            {imageUrlLocal && (
                <div {...getRootProps()} className={`${styles.dropzone} ${isLoading ? styles.loading : ''}`}>
                    {isLoading && (
                        <div className={styles.loadingOverlay}>
                            <FiLoader className={styles.loadingIcon} />
                        </div>
                    )}
                    <img src={imageUrlLocal} alt="Изображение" />
                </div>
            )}

            {!imageUrlLocal && (
                <div {...getRootProps()} className={`${styles.dropzone} ${isLoading ? styles.loading : ''}`}>
                    <input {...getInputProps()} />
                    {isLoading ? (
                        <FiLoader className={styles.loadingIcon} />
                    ) : (
                        <>
                            <FiUpload className={styles.uploadIcon} />
                            <p className={styles.dropzoneText}>
                                {isDragActive ? 'Перетащите файл сюда' : 'Перетащите изображение или кликните для выбора'}
                            </p>
                        </>
                    )}
                </div>
            )}
            <div className={styles.replaceImageButton}>
                <Button variant="outline" size="sm" onClick={handleReplaceImageClick} disabled={isLoading}>
                    Заменить изображение
                </Button>
            </div>
        </div>
    );
};

export default ImageEditBox;

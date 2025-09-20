import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiLoader } from 'react-icons/fi';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { Theme } from '@/types/theme';
import styles from '../ThemeEditor.module.css';

interface LogoProps {
    theme: Theme;
    onLogoChange: (logoUrl: string | null) => void;
}

export default function Logo({ theme, onLogoChange }: LogoProps) {
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [imageError, setImageError] = useState('');

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                setIsLoadingImage(true);
                setImageError('');

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
                        onLogoChange(data.url);
                        setImageError('');
                    })
                    .catch(err => {
                        setImageError(err instanceof Error ? err.message : 'Не удалось загрузить изображение');
                    })
                    .finally(() => {
                        setIsLoadingImage(false);
                    });
            }
        },
        [onLogoChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        },
        disabled: isLoadingImage,
    });

    const handleReplaceLogo = useCallback(() => {
        onLogoChange(null);
        setImageError('');
    }, [onLogoChange]);

    return (
        <div className={styles.section}>
            <Label htmlFor="logo-upload">Логотип темы</Label>
            
            {theme.logo ? (
                <div className={styles.logoPreview}>
                    <div className={styles.logoImageContainer}>
                        <img 
                            src={theme.logo} 
                            alt="Логотип темы" 
                            className={styles.logoImage}
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleReplaceLogo}
                        disabled={isLoadingImage}
                        className={styles.replaceButton}
                    >
                        Заменить
                    </Button>
                </div>
            ) : (
                <div 
                    {...getRootProps()} 
                    className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''} ${isLoadingImage ? styles.dropzoneLoading : ''}`}
                >
                    <input {...getInputProps()} id="logo-upload" />
                    {isLoadingImage ? (
                        <div className={styles.loadingContainer}>
                            <FiLoader className={styles.loadingIcon} />
                            <span>Загрузка...</span>
                        </div>
                    ) : (
                        <div className={styles.dropzoneContent}>
                            <FiUpload className={styles.uploadIcon} />
                            <p className={styles.dropzoneText}>
                                {isDragActive
                                    ? 'Перетащите файл сюда'
                                    : 'Перетащите изображение или кликните для выбора'}
                            </p>
                            <p className={styles.dropzoneSubtext}>
                                Поддерживаются форматы: PNG, JPG, JPEG, GIF, WebP
                            </p>
                        </div>
                    )}
                </div>
            )}
            
            {imageError && (
                <div className={styles.error}>
                    {imageError}
                </div>
            )}
        </div>
    );
}
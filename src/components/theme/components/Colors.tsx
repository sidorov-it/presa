import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiLoader } from 'react-icons/fi';
import { ColorPicker } from '../../ui/ColorPicker/ColorPicker';
// import { InfoIcon } from '../../ui/InfoIcon';
import { Label } from '../../ui/Label';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input/Input';
import { Button } from '../../ui/Button';

import { Theme, ThemeTypography } from '@/types/theme';
import { ThemeColors } from '@/types/theme';
import styles from '../ThemeEditor.module.css';
import { getContrastingTextColor } from '@/utils/themeUtils';

export default function Colors({
    theme,
    onColorsChange,
    onTypographyChange,
}: {
    theme: Theme;
    onColorsChange: (colors: Partial<ThemeColors>) => void;
    onTypographyChange: (typography: Partial<ThemeTypography>) => void;
}) {
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
                        onColorsChange({
                            pageBackground: {
                                ...theme.colors.pageBackground,
                                imageUrl: data.url,
                            },
                        });
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
        [onColorsChange, theme.colors.pageBackground]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        },
        disabled: isLoadingImage,
    });

    const handleImageUrlChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const imageUrl = e.target.value;
            if (!imageUrl) {
                onColorsChange({
                    pageBackground: {
                        ...theme.colors.pageBackground,
                        imageUrl: '',
                    },
                });
                return;
            }

            try {
                const url = new URL(imageUrl);
                const isExternalUrl = !url.hostname.includes(window.location.hostname);

                if (isExternalUrl) {
                    setIsLoadingImage(true);
                    setImageError('');

                    const imageResponse = await fetch(imageUrl);
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
                    onColorsChange({
                        pageBackground: {
                            ...theme.colors.pageBackground,
                            imageUrl: data.url,
                        },
                    });
                    setImageError('');
                } else {
                    onColorsChange({
                        pageBackground: {
                            ...theme.colors.pageBackground,
                            imageUrl: imageUrl,
                        },
                    });
                }
            } catch (error) {
                setImageError(error instanceof Error ? error.message : 'Не удалось загрузить изображение');
            } finally {
                setIsLoadingImage(false);
            }
        },
        [onColorsChange, theme.colors.pageBackground]
    );

    const handleClearImage = useCallback(() => {
        onColorsChange({
            pageBackground: {
                ...theme.colors.pageBackground,
                imageUrl: '',
            },
        });
        setImageError('');
    }, [theme.colors.pageBackground]);

    const handlePrimaryAccentChange = useCallback(
        (color: string) => {
            const primaryAccentTextColor = getContrastingTextColor(color);
            onColorsChange({
                primaryAccent: color,
                primaryAccentTextColor: primaryAccentTextColor as '#000000' | '#FFFFFF',
            });
        },
        [onColorsChange]
    );

    const handleTypographyChange = useCallback(
        (key: keyof ThemeTypography, value: string) => {
            onTypographyChange({
                [key]: value,
            });
        },
        [onTypographyChange]
    );

    const handleHeadingColorChange = useCallback(
        (color: string) => {
            handleTypographyChange('headingColor', color);
        },
        [handleTypographyChange]
    );

    const handleBodyColorChange = useCallback(
        (color: string) => {
            handleTypographyChange('bodyColor', color);
        },
        [handleTypographyChange]
    );

    const handleSlideBackgroundChange = useCallback(
        (color: string) => {
            onColorsChange({ slideBackground: color });
        },
        [onColorsChange]
    );

    const handlePageBackgroundTypeChange = useCallback(
        ({ value }: { value: string[] }) =>
            onColorsChange({
                pageBackground: {
                    ...theme.colors.pageBackground,
                    type: value[0] as 'color' | 'image',
                },
            }),
        [onColorsChange, theme.colors.pageBackground]
    );

    const handlePageBackgroundColorChange = useCallback(
        (color: string) => {
            onColorsChange({
                pageBackground: {
                    ...theme.colors.pageBackground,
                    color,
                },
            });
        },
        [onColorsChange, theme.colors.pageBackground]
    );

    return (
        <div style={{ width: '100%' }}>
            <div>
                <h3 className={styles.sectionTitle}>Colors</h3>
                <h4 className={styles.sectionSubtitle}>
                    Палитра
                    {/* <InfoIcon tooltip="Эти цвета появляются в палитре цветов при использовании этой темы. Основной акцентный цвет используется по умолчанию для ссылок, кнопок и других элементов." /> */}
                </h4>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Label>Основной акцентный цвет</Label>
                        <ColorPicker value={theme.colors?.primaryAccent} onChange={handlePrimaryAccentChange} />
                    </div>
                </div>
            </div>

            <div>
                <h4 className={styles.sectionSubtitle}>Текст</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <Label>Цвет заголовков</Label>
                        <ColorPicker value={theme.typography.headingColor} onChange={handleHeadingColorChange} />
                    </div>
                    <div>
                        <Label>Цвет текста</Label>
                        <ColorPicker value={theme.typography.bodyColor} onChange={handleBodyColorChange} />
                    </div>
                </div>
            </div>

            <div>
                <h4 className={styles.sectionSubtitle}>Фон</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <Label>Цвет слайда</Label>
                        <ColorPicker
                            value={theme.colors.slideBackground}
                            onChange={handleSlideBackgroundChange}
                            allowAlpha={true}
                        />
                    </div>
                    <div>
                        <Label>Фон страницы</Label>
                        <div style={{ display: 'flex', marginTop: '8px', flexDirection: 'column', gap: '8px' }}>
                            <Select
                                options={[
                                    { value: 'color', label: 'Цвет' },
                                    { value: 'image', label: 'Изображение' },
                                ]}
                                value={[theme.colors.pageBackground.type]}
                                onValueChange={handlePageBackgroundTypeChange}
                            />
                            {theme.colors.pageBackground.type === 'color' ? (
                                <ColorPicker
                                    value={theme.colors.pageBackground.color}
                                    onChange={handlePageBackgroundColorChange}
                                />
                            ) : (
                                <>
                                    <Label>Адрес изображения</Label>
                                    <Input
                                        variant="outline"
                                        value={theme.colors.pageBackground.imageUrl}
                                        onChange={handleImageUrlChange}
                                        placeholder="Адрес изображения"
                                        disabled={isLoadingImage}
                                        isInvalid={!!imageError}
                                    />
                                    {/* Image Preview */}
                                    {theme.colors.pageBackground.imageUrl && (
                                        <div style={{ position: 'relative', marginTop: '8px' }}>
                                            <div
                                                {...getRootProps()}
                                                style={{
                                                    border: '2px dashed var(--color-border)',
                                                    borderRadius: '0.5rem',
                                                    padding: '1rem',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    backgroundColor: 'var(--color-surface)',
                                                    position: 'relative',
                                                    opacity: isLoadingImage ? 0.7 : 1,
                                                }}
                                            >
                                                {isLoadingImage && (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            backgroundColor: 'rgba(30, 30, 30, 0.8)',
                                                        }}
                                                    >
                                                        <FiLoader
                                                            style={{
                                                                fontSize: '1.5rem',
                                                                color: 'var(--color-primary)',
                                                                animation: 'spin 1s linear infinite',
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                <img
                                                    src={theme.colors.pageBackground.imageUrl}
                                                    alt="Фон страницы"
                                                    style={{
                                                        maxWidth: '100%',
                                                        height: 'auto',
                                                        maxHeight: '200px',
                                                        borderRadius: '0.375rem',
                                                    }}
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClearImage}
                                                disabled={isLoadingImage}
                                                style={{ marginTop: '8px' }}
                                            >
                                                Удалить изображение
                                            </Button>
                                        </div>
                                    )}

                                    {/* Dropzone for new image */}
                                    {!theme.colors.pageBackground.imageUrl && (
                                        <div
                                            {...getRootProps()}
                                            style={{
                                                border: '2px dashed var(--color-border)',
                                                borderRadius: '0.5rem',
                                                padding: '2rem',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                marginTop: '8px',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                backgroundColor: 'var(--color-surface)',
                                                ...(isDragActive && {
                                                    borderColor: 'var(--color-primary)',
                                                    backgroundColor: 'var(--color-background)',
                                                }),
                                                opacity: isLoadingImage ? 0.7 : 1,
                                            }}
                                        >
                                            <input {...getInputProps()} />
                                            {isLoadingImage ? (
                                                <FiLoader
                                                    style={{
                                                        fontSize: '2rem',
                                                        color: 'var(--color-primary)',
                                                        animation: 'spin 1s linear infinite',
                                                    }}
                                                />
                                            ) : (
                                                <>
                                                    <FiUpload
                                                        style={{
                                                            fontSize: '2rem',
                                                            color: 'var(--color-text-light)',
                                                            marginBottom: '0.5rem',
                                                        }}
                                                    />
                                                    <p
                                                        style={{
                                                            color: 'var(--color-text-light)',
                                                            margin: 0,
                                                            fontSize: '0.875rem',
                                                        }}
                                                    >
                                                        {isDragActive
                                                            ? 'Перетащите файл сюда'
                                                            : 'Перетащите изображение или кликните для выбора'}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {imageError && (
                                        <div
                                            style={{
                                                marginTop: '0.25rem',
                                                fontSize: '0.75rem',
                                                lineHeight: '1rem',
                                                color: 'var(--color-error)',
                                            }}
                                        >
                                            {imageError}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

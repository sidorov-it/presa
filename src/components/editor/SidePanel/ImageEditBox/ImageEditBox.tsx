/* eslint-disable prettier/prettier */
'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiLoader, FiZap } from 'react-icons/fi';

import styles from './ImageEditBox.module.css';
import { Button } from '@/components/ui/Button';
import { useMenuStore } from '@/store/menuStore';
import { Select } from '@/components/ui/Select';
import { Popover } from '@/components/ui/Popover/Popover';
import { Textarea } from '@/components/ui/Textarea';
import { useAIImageStore, GeneratedImage } from '@/store/aiImageStore';
import { usePresentationStore } from '@/store/presentationStore';

interface ImageEditBoxProps {
    imageUrl: string;
    onClearImage: () => void;
    onUpdateLink: (link: string, uploaded: boolean) => void;
    elementId?: string;
    presentationId?: string;
    slideId?: string;
    layoutId?: string;
    itemId?: string; // For SmartLayout items
    defaultMode?: 'upload' | 'ai'; // Optional default mode
}

type ImageMode = 'upload' | 'ai';
type StyleOption =
    | 'none'
    | 'custom'
    | 'realistic'
    | 'photography'
    | 'analog-film'
    | 'artistic'
    | 'anime'
    | 'digital-art'
    | 'fantasy-art'
    | 'vaporwave'
    | 'isometric'
    | 'low-poly'
    | 'claymation'
    | 'origami'
    | 'line-art'
    | 'pixel-art'
    | 'texture';

const styleOptions = [
    { value: 'none', label: 'Без стиля', prompt: 'Стиль: none' },
    { value: 'custom', label: 'Пользовательский', prompt: 'Стиль: custom' },
    { value: 'realistic', label: 'Реалистичный', prompt: 'Стиль: realistic' },
    { value: 'photography', label: 'Фотография', prompt: 'Стиль: photography' },
    { value: 'analog-film', label: 'Аналоговая пленка', prompt: 'Стиль: analog-film' },
    { value: 'artistic', label: 'Художественный', prompt: 'Стиль: artistic' },
    { value: 'anime', label: 'Аниме', prompt: 'Стиль: anime' },
    { value: 'digital-art', label: 'Цифровое искусство', prompt: 'Стиль: digital-art' },
    { value: 'fantasy-art', label: 'Фэнтези арт', prompt: 'Стиль: fantasy-art' },
    { value: 'vaporwave', label: 'Вейпорвейв', prompt: 'Стиль: vaporwave' },
    { value: 'isometric', label: 'Изометрический', prompt: 'Стиль: isometric' },
    { value: 'low-poly', label: 'Лоу-поли', prompt: 'Стиль: low-poly' },
    { value: 'claymation', label: 'Пластилиновая анимация', prompt: 'Стиль: claymation' },
    { value: 'origami', label: 'Оригами', prompt: 'Стиль: origami' },
    { value: 'line-art', label: 'Линейная графика', prompt: 'Стиль: line-art' },
    { value: 'pixel-art', label: 'Пиксель арт', prompt: 'Стиль: pixel-art' },
    { value: 'texture', label: 'Текстура', prompt: 'Стиль: texture' },
];

const ImageEditBox: React.FC<ImageEditBoxProps> = ({
    imageUrl,
    onClearImage,
    onUpdateLink,
    elementId,
    presentationId,
    slideId,
    layoutId,
    itemId,
    defaultMode = 'upload',
}) => {
    const [imageMode, setImageMode] = useState<ImageMode>(defaultMode);
    const [imageUrlLocal, setImageUrlLocal] = useState(imageUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isStylePopoverOpen, setIsStylePopoverOpen] = useState(false);

    // AI Image Store
    const aiImageStore = useAIImageStore();

    // Create unique identifier for AI store (element or item)
    const aiStoreId = itemId
        ? `${presentationId}_${slideId}_${layoutId}_${elementId}_${itemId}`
        : `${presentationId}_${slideId}_${layoutId}_${elementId}`;

    // Get current element data
    const currentElement = usePresentationStore(state =>
        state.getElement(presentationId!, slideId!, layoutId!, elementId!)
    );

    // Get current item data for SmartLayout
    const currentItem =
        itemId && currentElement ? (currentElement as any).items?.find((item: any) => item.id === itemId) : null;

    // AI generation states from store
    const isGenerating = aiStoreId ? aiImageStore.isGenerating(aiStoreId) : false;
    const generatedImages = aiStoreId ? aiImageStore.getGeneratedImages(aiStoreId) : [];
    const prompt = aiStoreId ? aiImageStore.getPrompt(aiStoreId) : '';
    const selectedStyle = aiStoreId ? (aiImageStore.getStyle(aiStoreId) as StyleOption) : 'none';
    const customStyle = aiStoreId ? aiImageStore.getCustomStyle(aiStoreId) : '';
    const aiError = aiStoreId ? aiImageStore.getError(aiStoreId) : null;

    // Initialize state from element data
    useEffect(() => {
        if (aiStoreId) {
            const dataSource = currentItem || currentElement;

            // Set AI mode if element/item has AI generation data
            if ((dataSource?.aiPrompt || dataSource?.generatedImages?.length) && imageMode !== 'ai') {
                setImageMode('ai');
            }
            // Initialize AI store with element/item data
            if (dataSource?.aiPrompt) {
                aiImageStore.setPrompt(aiStoreId, dataSource.aiPrompt);
            }
            if (dataSource?.aiStyle) {
                aiImageStore.setStyle(aiStoreId, dataSource.aiStyle);
            }
            if (dataSource?.aiCustomStyle) {
                aiImageStore.setCustomStyle(aiStoreId, dataSource.aiCustomStyle);
            }
            if (dataSource?.generatedImages?.length) {
                const images: GeneratedImage[] = dataSource.generatedImages.map((url: string, index: number) => ({
                    id: `${aiStoreId}-${index}`,
                    url,
                    alt: `Generated image ${index + 1}`,
                }));
                aiImageStore.setGeneratedImages(aiStoreId, images);
            }
            // Не инициализируем isGenerating из элемента - это только клиентское состояние
        }
    }, [currentElement, currentItem, aiStoreId, imageMode]);

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
            const url = new URL(link);
            const isExternalUrl = !url.hostname.includes(window.location.hostname);

            if (isExternalUrl) {
                setIsLoading(true);
                setError('');

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
                onUpdateLink(link, false);
                setImageUrlLocal(link);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Не удалось загрузить изображение');
            setImageUrlLocal(imageUrl);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReplaceImageClick = useCallback(() => {
        onClearImage();
        setImageUrlLocal('');
        setError('');
        if (aiStoreId) {
            aiImageStore.setGeneratedImages(aiStoreId, []);
        }
    }, [onClearImage, aiStoreId, aiImageStore]);

    const handleGenerateImages = async () => {
        if (!aiStoreId || !prompt.trim()) {
            setError('Введите описание изображения');
            return;
        }

        // Set generating state in store
        aiImageStore.setGenerating(aiStoreId, true);
        aiImageStore.clearError(aiStoreId);
        setError('');

        // Не обновляем элемент с isGenerating в БД - это только клиентское состояние

        try {
            let fullPrompt = prompt.trim();

            // Add style to prompt
            if (selectedStyle !== 'none') {
                if (selectedStyle === 'custom' && customStyle.trim()) {
                    fullPrompt += `, стиль: ${customStyle.trim()}`;
                } else if (selectedStyle !== 'custom') {
                    const styleLabel = styleOptions.find(opt => opt.value === selectedStyle)?.label;
                    if (styleLabel) {
                        fullPrompt += `, стиль: ${styleLabel}`;
                    }
                }
            }

            const response = await fetch('/api/images/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    count: 3,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Не удалось сгенерировать изображения');
            }

            const data = await response.json();
            const images: GeneratedImage[] = data.images.map(
                (
                    image: {
                        url: string;
                    },
                    index: number
                ) => ({
                    id: `${aiStoreId}-${index}`,
                    url: image.url,
                })
            );

            // Store generated images in AI store
            aiImageStore.setGeneratedImages(aiStoreId, images);

            // Select first image automatically and update element/item
            if (images.length > 0 && presentationId && slideId && layoutId && elementId) {
                const firstImage = images[0];
                aiImageStore.setSelectedImage(aiStoreId, firstImage.id);

                if (itemId) {
                    // Update SmartLayout item
                    const element = usePresentationStore
                        .getState()
                        .getElement(presentationId, slideId, layoutId, elementId);
                    if (element && (element as any).items) {
                        const updatedItems = (element as any).items.map((item: any) =>
                            item.id === itemId
                                ? {
                                      ...item,
                                      imageUrl: firstImage.url,
                                      generatedImages: images.map(img => img.url),
                                      aiPrompt: prompt,
                                      aiStyle: selectedStyle,
                                      aiCustomStyle: customStyle,
                                      uploaded: true,
                                  }
                                : item
                        );
                        usePresentationStore.getState().updateElement({
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            data: { items: updatedItems },
                        });
                    }
                } else {
                    // Update regular ImageElement
                    usePresentationStore.getState().updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: {
                            src: firstImage.url,
                            generatedImages: images.map(img => img.url),
                            aiPrompt: prompt,
                            aiStyle: selectedStyle,
                            aiCustomStyle: customStyle,
                            uploaded: true,
                        },
                    });
                }

                // Update local state and callback
                setImageUrlLocal(firstImage.url);
                onUpdateLink(firstImage.url, true);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Не удалось сгенерировать изображения';
            aiImageStore.setError(aiStoreId, errorMessage);
            setError(errorMessage);

            // Не обновляем элемент с isGenerating: false в БД при ошибке
        } finally {
            aiImageStore.setGenerating(aiStoreId, false);
        }
    };

    const handleSelectGeneratedImage = (image: GeneratedImage) => {
        if (aiStoreId) {
            aiImageStore.setSelectedImage(aiStoreId, image.id);
        }

        // Update element/item with selected image
        if (elementId && presentationId && slideId && layoutId) {
            if (itemId) {
                // Update SmartLayout item
                const element = usePresentationStore
                    .getState()
                    .getElement(presentationId, slideId, layoutId, elementId);
                if (element && (element as any).items) {
                    const updatedItems = (element as any).items.map((item: any) =>
                        item.id === itemId ? { ...item, imageUrl: image.url } : item
                    );
                    usePresentationStore.getState().updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: { items: updatedItems },
                    });
                }
            } else {
                // Update regular ImageElement
                usePresentationStore.getState().updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: {
                        src: image.url,
                    },
                });
            }
        }

        onUpdateLink(image.url, true);
        setImageUrlLocal(image.url);
    };

    const handleStyleOptionClick = (optionValue: StyleOption) => {
        if (aiStoreId) {
            aiImageStore.setStyle(aiStoreId, optionValue);
        }
        setIsStylePopoverOpen(false);
    };

    const handlePromptChange = (value: string) => {
        if (aiStoreId) {
            aiImageStore.setPrompt(aiStoreId, value);
        }
    };

    const handleCustomStyleChange = (value: string) => {
        if (aiStoreId) {
            aiImageStore.setCustomStyle(aiStoreId, value);
        }
    };

    const handleImageClick = (image: GeneratedImage) => {
        handleSelectGeneratedImage(image);
    };

    const handleImageKeyDown = (e: React.KeyboardEvent, image: GeneratedImage) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectGeneratedImage(image);
        }
    };

    const renderStylePopoverContent = () => (
        <div className={styles.stylePopoverContent}>
            {styleOptions.map(option => (
                <button
                    key={option.value}
                    className={`${styles.styleOption} ${selectedStyle === option.value ? styles.styleOptionSelected : ''}`}
                    onClick={() => {
                        handleCustomStyleChange(option.prompt);
                        handleStyleOptionClick(option.value as StyleOption);
                    }}
                    disabled={isGenerating}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );

    const renderUploadMode = () => (
        <>
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
                                {isDragActive
                                    ? 'Перетащите файл сюда'
                                    : 'Перетащите изображение или кликните для выбора'}
                            </p>
                        </>
                    )}
                </div>
            )}
        </>
    );

    const renderAIMode = () => (
        <>
            {/* Generated Images Preview */}
            {generatedImages.length > 0 && (
                <div className={styles.generatedImagesSection}>
                    <h4 className={styles.sectionTitle}>Сгенерированные изображения</h4>
                    <div className={styles.generatedImagesGrid}>
                        {generatedImages.map(image => (
                            <div
                                key={image.id}
                                className={`${styles.generatedImageItem} ${imageUrlLocal === image.url ? styles.selectedImage : ''}`}
                                onClick={() => handleImageClick(image)}
                                onKeyDown={e => handleImageKeyDown(e, image)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Выбрать сгенерированное изображение ${image.id}`}
                            >
                                <img src={image.url} alt="Сгенерированное изображение" />
                                {imageUrlLocal === image.url && (
                                    <div className={styles.selectedImageOverlay}>
                                        <div className={styles.selectedImageCheck}>✓</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Prompt Input */}
            <div className={styles.inputGroup}>
                <label htmlFor="aiPrompt" className={styles.label}>
                    Описание изображения
                </label>
                <Textarea
                    id="aiPrompt"
                    value={prompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handlePromptChange(e.target.value)}
                    placeholder="Опишите, какое изображение вы хотите создать..."
                    rows={3}
                    className={styles.promptTextarea}
                    disabled={isGenerating}
                />
            </div>

            {/* Style Selection */}
            <div className={styles.inputGroup}>
                <span className={styles.label}>Стиль</span>
                <Popover
                    trigger={
                        <Button variant="outline" size="sm" className={styles.styleButton}>
                            {styleOptions.find(opt => opt.value === selectedStyle)?.label || 'Выберите стиль'}
                        </Button>
                    }
                    content={renderStylePopoverContent()}
                    isOpen={isStylePopoverOpen}
                    onOpen={() => setIsStylePopoverOpen(true)}
                    onClose={() => setIsStylePopoverOpen(false)}
                />
            </div>

            {/* Custom Style Input */}
            {selectedStyle && (
                <div className={styles.inputGroup}>
                    <label htmlFor="customStyle" className={styles.label}>
                        Описание стиля
                    </label>
                    <Textarea
                        id="customStyle"
                        value={customStyle}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            handleCustomStyleChange(e.target.value)
                        }
                        placeholder="Опишите желаемый стиль..."
                        rows={2}
                        className={styles.customStyleTextarea}
                        disabled={isGenerating}
                    />
                </div>
            )}

            {/* Generate Button */}
            <div className={styles.generateSection}>
                <Button
                    variant="solid"
                    colorScheme="blue"
                    leftIcon={<FiZap />}
                    onClick={handleGenerateImages}
                    isLoading={isGenerating}
                    isDisabled={!prompt.trim() || isGenerating}
                    className={styles.generateButton}
                >
                    {isGenerating ? 'Генерация...' : 'Сгенерировать (3 токена)'}
                </Button>
            </div>

            {(error || aiError) && <div className={styles.error}>{error || aiError}</div>}
        </>
    );

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Редактирование изображения</h3>
            <div className={styles.closeButton}>
                <Button variant="outline" size="sm" onClick={() => useMenuStore.getState().closeSideMenu()}>
                    ×
                </Button>
            </div>

            {/* Mode Selection */}
            <div className={styles.inputGroup}>
                <span className={styles.label}>Источник изображения</span>
                <Select
                    options={[
                        { value: 'upload', label: 'Загрузить изображение или URL' },
                        { value: 'ai', label: 'AI изображение' },
                    ]}
                    value={[imageMode]}
                    onValueChange={details => setImageMode(details.value[0] as ImageMode)}
                    placeholder="Выберите источник"
                />
            </div>

            {/* Render content based on selected mode */}
            {imageMode === 'upload' ? renderUploadMode() : renderAIMode()}

            {/* Replace Image Button */}
            <div className={styles.replaceImageButton}>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReplaceImageClick}
                    disabled={isLoading || isGenerating}
                >
                    Заменить изображение
                </Button>
            </div>
        </div>
    );
};

export default ImageEditBox;

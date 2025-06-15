import React, { MutableRefObject, useCallback, useState } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SLIDE_TEMPLATES, TipTapRefs } from '@/types';
import styles from './SlideTemplateSelector.module.css';
import ColorPicker from '@/components/ui/ColorPicker';
import { MdOutlineVerticalAlignTop, MdOutlineVerticalAlignCenter, MdOutlineVerticalAlignBottom } from 'react-icons/md';
import { useHistoryStore } from '@/store/historyStore';
import { FiLoader } from 'react-icons/fi';

type SlideTemplateType = (typeof SLIDE_TEMPLATES)[number]['value'];
type ContentAlignment = 'top' | 'center' | 'bottom';

interface SlideTemplateSelectorProps {
    presentationId: string;
    slideId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const DEFAULT_HEIGHT_PX = 200;
const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const DEFAULT_TEXT_COLOR = '#000000';

const SlideTemplateSelector: React.FC<SlideTemplateSelectorProps> = ({ presentationId, slideId, tiptapRefs }) => {
    const slide = usePresentationStore(
        useCallback(state => state.getSlide(presentationId, slideId), [presentationId, slideId])
    );
    const updateSlide = usePresentationStore(state => state.updateSlide);

    const templateType = slide?.templateType || 'standard';
    const imageUrl = slide?.imageUrl || '';
    const backgroundColor = slide?.background?.type === 'color' ? slide.background.value : DEFAULT_BACKGROUND_COLOR;
    const contentAlignment = slide?.contentAlignment || 'center';

    const commonSlideTextColor = usePresentationStore
        .getState()
        .getCommonSlideTextColor(tiptapRefs, presentationId, slideId);
    const [textColor, setTextColor] = useState(commonSlideTextColor || DEFAULT_TEXT_COLOR);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTemplateChange = (value: SlideTemplateType) => {
        // Set default image size based on template type
        let imageSize;
        if (value === 'imageTop') {
            imageSize = { height: `${DEFAULT_HEIGHT_PX}px` };
        } else if (value === 'imageLeft' || value === 'imageRight') {
            imageSize = { width: '33%' };
        }

        // Update template type and image size
        updateSlide(presentationId, slideId, {
            templateType: value as SlideTemplateType,
            imageSize,
        });

        // Update background if template is imageBackground
        if (value === 'imageBackground' && imageUrl) {
            updateSlide(presentationId, slideId, {
                background: {
                    type: 'image',
                    value: imageUrl,
                },
            });
        } else if (slide?.background.type === 'image' && value !== 'imageBackground') {
            // Reset background to color if changing from imageBackground to another template
            updateSlide(presentationId, slideId, {
                background: {
                    type: 'color',
                    value: backgroundColor || DEFAULT_BACKGROUND_COLOR,
                },
            });
        }
    };

    const handleBackgroundColorChange = useCallback(
        (color: string) => {
            // Only update background if not using image background
            if (templateType !== 'imageBackground') {
                updateSlide(presentationId, slideId, {
                    background: {
                        type: 'color',
                        value: color,
                    },
                });
            }
        },
        [templateType, presentationId, slideId, updateSlide]
    );

    const handleTextColorChange = useCallback(
        (color: string) => {
            console.log('handleTextColorChange', color);
            const elements = usePresentationStore.getState().getSlideElements(presentationId, slideId);

            useHistoryStore.getState().beginTransaction(presentationId, 'change text color');

            // Update slide text color in state
            updateSlide(presentationId, slideId, { textColor: color });

            // Update existing elements
            elements.forEach(element => {
                if (tiptapRefs.current?.editors[element.id]) {
                    tiptapRefs.current.editors[element.id]?.editor
                        .chain()
                        .setMeta('transaction', true)
                        .focus(null, { scrollIntoView: false })
                        .selectAll()
                        .setColor(color)
                        .blur()
                        .run();
                }
            });

            useHistoryStore.getState().commitTransaction(presentationId);

            setTextColor(color);
        },
        [tiptapRefs, presentationId, slideId, updateSlide]
    );

    const handleImageUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;

        if (!url) {
            updateSlide(presentationId, slideId, { imageUrl: '' });
            return;
        }

        try {
            // Check if URL is from external domain
            const urlObj = new URL(url);
            const isExternalUrl = !urlObj.hostname.includes(window.location.hostname);

            if (isExternalUrl) {
                setIsLoading(true);
                setError('');

                const response = await fetch('/api/assets/upload-external', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ imageUrl: url }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Не удалось загрузить изображение');
                }

                const data = await response.json();
                updateSlide(presentationId, slideId, { imageUrl: data.url });

                // Update background if template is imageBackground
                if (templateType === 'imageBackground') {
                    updateSlide(presentationId, slideId, {
                        background: {
                            type: 'image',
                            value: data.url,
                        },
                    });
                }
                setError('');
            } else {
                // Local URL, use as is
                updateSlide(presentationId, slideId, { imageUrl: url });

                // Update background if template is imageBackground
                if (templateType === 'imageBackground' && url) {
                    updateSlide(presentationId, slideId, {
                        background: {
                            type: 'image',
                            value: url,
                        },
                    });
                }
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Не удалось загрузить изображение');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsLoading(true);
            setError('');

            const formData = new FormData();
            formData.append('file', e.target.files[0]);

            fetch('/api/assets/upload', {
                method: 'POST',
                body: formData,
            })
                .then(async response => {
                    if (!response.ok) {
                        throw new Error('Не удалось загрузить изображение');
                    }
                    const data = await response.json();
                    updateSlide(presentationId, slideId, { imageUrl: data.url });

                    // Update background if template is imageBackground
                    if (templateType === 'imageBackground') {
                        updateSlide(presentationId, slideId, {
                            background: {
                                type: 'image',
                                value: data.url,
                            },
                        });
                    }
                    setError('');
                })
                .catch(err => {
                    setError(err instanceof Error ? err.message : 'Не удалось загрузить изображение');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    };

    const handleContentAlignmentChange = (alignment: ContentAlignment) => {
        updateSlide(presentationId, slideId, {
            contentAlignment: alignment,
        });
    };

    const needsImage = ['imageTop', 'imageLeft', 'imageRight', 'imageBackground'].includes(templateType);
    const showBackgroundColor = templateType !== 'imageBackground';

    return (
        <div className={styles.container}>
            <div className={styles.templateSelector}>
                <h3 className={styles.templateSelectorTitle}>Шаблон</h3>
                <div className={styles.templateSelectorButtons}>
                    {SLIDE_TEMPLATES.map(t => (
                        <button
                            key={t.value}
                            className={`${styles.templateButton} ${templateType === t.value ? styles.active : ''}`}
                            onClick={() => handleTemplateChange(t.value)}
                            aria-label={t.label}
                        >
                            <div className={`${styles.templateButtonIcon} ${styles[t.value]}`} />
                        </button>
                    ))}
                </div>
            </div>

            {needsImage && (
                <div className={styles.imageUploadSection}>
                    <label className={styles.label}>
                        Изображение
                        {isLoading && <FiLoader className={`${styles.loadingIcon} ${styles.spin}`} />}
                    </label>
                    <input
                        type="url"
                        value={imageUrl}
                        className={`${styles.input} ${error ? styles.inputError : ''}`}
                        placeholder="https://example.com/image.jpg"
                        onChange={handleImageUrlChange}
                        disabled={isLoading}
                    />
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.uploadButton}>
                        или{' '}
                        <label className={styles.fileInputLabel}>
                            Загрузить изображение
                            <input
                                type="file"
                                accept="image/*"
                                className={styles.fileInput}
                                onChange={handleFileUpload}
                                disabled={isLoading}
                            />
                        </label>
                    </div>
                </div>
            )}

            {showBackgroundColor && (
                <div className={styles.templateSelectorBackgroundColor}>
                    <label htmlFor="slide-background-color" className={styles.templateSelectorBackgroundColorLabel}>
                        Цвет фона
                    </label>
                    <div className={styles.templateSelectorBackgroundColorPicker}>
                        <ColorPicker
                            value={backgroundColor}
                            onChange={color => handleBackgroundColorChange(color)}
                            allowAlpha={true}
                            className={styles.colorPicker}
                        />
                    </div>
                </div>
            )}

            <div className={styles.templateSelectorTextColor}>
                <label htmlFor="slide-background-color" className={styles.templateSelectorTextColorLabel}>
                    Цвет текста
                </label>
                <div className={styles.templateSelectorTextColorPicker}>
                    <ColorPicker
                        className={styles.colorPicker}
                        value={textColor}
                        allowAlpha={true}
                        onChange={color => handleTextColorChange(color)}
                    />
                </div>
            </div>
            <div className={styles.templateSelectorTextColor}>
                <label htmlFor="slide-background-color" className={styles.templateSelectorTextColorLabel}>
                    Выравнивание контента
                </label>
                <div className={`${styles.alignmentGroup}`}>
                    <button
                        onClick={() => handleContentAlignmentChange('top')}
                        className={`${styles.button} ${contentAlignment === 'top' ? styles.active : ''}`}
                        aria-label="Align Top"
                        title="Вверх"
                    >
                        <MdOutlineVerticalAlignTop size={16} />
                    </button>
                    <button
                        onClick={() => handleContentAlignmentChange('center')}
                        className={`${styles.button} ${contentAlignment === 'center' ? styles.active : ''}`}
                        aria-label="Align Center"
                        title="По центру"
                    >
                        <MdOutlineVerticalAlignCenter size={16} />
                    </button>
                    <button
                        onClick={() => handleContentAlignmentChange('bottom')}
                        className={`${styles.button} ${contentAlignment === 'bottom' ? styles.active : ''}`}
                        aria-label="Align Bottom"
                        title="Вниз"
                    >
                        <MdOutlineVerticalAlignBottom size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SlideTemplateSelector;

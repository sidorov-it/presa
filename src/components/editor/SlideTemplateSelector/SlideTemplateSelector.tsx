import React, { MutableRefObject, useCallback, useState } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SLIDE_TEMPLATES, SmartLayoutElement, SmartLayoutItem, TipTapRefs } from '@/types';
import styles from './SlideTemplateSelector.module.css';
import ColorPicker from '@/components/ui/ColorPicker';
import { MdOutlineVerticalAlignTop, MdOutlineVerticalAlignCenter, MdOutlineVerticalAlignBottom } from 'react-icons/md';
import { useHistoryStore } from '@/store/historyStore';
import { FiLoader } from 'react-icons/fi';
import { useThemeStore } from '@/store/themeStore';
import { useShallow } from 'zustand/react/shallow';
import getContrastTextColor from '@/utils/getContrastTextColor';
import { ElementType } from '@/types/elements';
import { HeaderFooterIcon } from '@/components/icons';
import { useUIStateStore } from '@/store/uiStateStore';

type SlideTemplateType = (typeof SLIDE_TEMPLATES)[number]['value'];
type ContentAlignment = 'top' | 'center' | 'bottom';

interface SlideTemplateSelectorProps {
    presentationId: string;
    slideId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const DEFAULT_TEXT_COLOR = '#000000';

const SlideTemplateSelector: React.FC<SlideTemplateSelectorProps> = ({ presentationId, slideId, tiptapRefs }) => {
    const slide = usePresentationStore(state => state.getSlide(presentationId, slideId));
    const currentTheme = useThemeStore(useShallow(state => state.currentTheme));
    const updateSlide = usePresentationStore(state => state.updateSlide);

    const templateType = slide?.templateType || 'standard';
    const imageUrl = slide?.imageUrl || '';

    let backgroundColor: string | undefined;

    if (!slide?.background?.type || slide?.background?.type === 'color') {
        backgroundColor = slide?.background?.value || currentTheme?.colors.slideBackground || DEFAULT_BACKGROUND_COLOR;
    }

    const contentAlignment = slide?.contentAlignment || 'center';

    const commonSlideTextColor = usePresentationStore
        .getState()
        .getCommonSlideTextColor(tiptapRefs, presentationId, slideId);

    const defaultTextColor = currentTheme?.typography.bodyColor || DEFAULT_TEXT_COLOR;

    const [textColor, setTextColor] = useState(commonSlideTextColor || defaultTextColor);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const setGlobalHeaderFooterModalOpen = useUIStateStore(state => state.setGlobalHeaderFooterModalOpen);

    const handleTemplateChange = (value: SlideTemplateType) => {
        // Set default image size based on template type
        let imageHeightRatio;
        let imageWidthRatio;
        if (value === 'imageTop') {
            imageHeightRatio = 0.33; // Default 33% height ratio
        } else if (value === 'imageLeft' || value === 'imageRight') {
            imageWidthRatio = 0.33; // Default 33% width ratio
        }

        useHistoryStore.getState().beginTransaction(presentationId, 'update slide template');

        // Prepare update data with ratios
        const updateData: any = { templateType: value as SlideTemplateType };
        if (imageHeightRatio !== undefined) {
            updateData.imageHeightRatio = imageHeightRatio;
        }
        if (imageWidthRatio !== undefined) {
            updateData.imageWidthRatio = imageWidthRatio;
        }

        // Update background if template is imageBackground
        if (value === 'imageBackground' && imageUrl) {
            updateSlide(presentationId, slideId, {
                ...updateData,
                background: {
                    type: 'image',
                    value: imageUrl,
                },
            });
        } else if (slide?.background?.type === 'image' && value !== 'imageBackground') {
            // Reset background to color if changing from imageBackground to another template
            updateSlide(presentationId, slideId, {
                ...updateData,
                background: {
                    type: 'color',
                    value: backgroundColor || DEFAULT_BACKGROUND_COLOR,
                },
            });
        } else {
            updateSlide(presentationId, slideId, updateData, true);
        }

        useHistoryStore.getState().commitTransaction(presentationId);
    };

    const handleBackgroundColorChange = useCallback(
        (color: string) => {
            // Only update background if not using image background
            if (templateType !== 'imageBackground') {
                const elements = usePresentationStore.getState().getSlideElements(presentationId, slideId);

                const textColor = getContrastTextColor(color);
                useHistoryStore.getState().beginTransaction(presentationId, 'change text color');

                // Update existing elements
                elements.forEach(element => {
                    if (tiptapRefs.current?.editors[element.id]) {
                        tiptapRefs.current.editors[element.id]?.editor
                            .chain()
                            .setMeta('transaction', true)
                            .focus(null, { scrollIntoView: false })
                            .selectAll()
                            .setColor(textColor)
                            .blur()
                            .run();
                    }
                });

                setTextColor(textColor);

                updateSlide(presentationId, slideId, {
                    background: {
                        type: 'color',
                        value: color,
                    },
                    textColor: textColor,
                });

                useHistoryStore.getState().commitTransaction(presentationId);
            }
        },
        [templateType, presentationId, slideId, updateSlide, tiptapRefs]
    );

    const handleTextColorChange = useCallback(
        (color: string) => {
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
                } else if (element.elementTypeId === ElementType.SMART_LAYOUT) {
                    (element as SmartLayoutElement).items.forEach((item: SmartLayoutItem) => {
                        const titleEditor = tiptapRefs.current.editors[`title-${element.id}-${item.id}`];
                        const textEditor = tiptapRefs.current.editors[`text-${element.id}-${item.id}`];

                        if (titleEditor) {
                            titleEditor.editor
                                .chain()
                                .setMeta('transaction', true)
                                .focus(null, { scrollIntoView: false })
                                .selectAll()
                                .setColor(color)
                                .blur()
                                .run();
                        }
                        if (textEditor) {
                            textEditor.editor
                                .chain()
                                .setMeta('transaction', true)
                                .focus(null, { scrollIntoView: false })
                                .selectAll()
                                .setColor(color)
                                .blur()
                                .run();
                        }
                    });
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

                // Update background if template is imageBackground
                if (templateType === 'imageBackground') {
                    updateSlide(presentationId, slideId, {
                        imageUrl: data.url,
                        background: {
                            type: 'image',
                            value: data.url,
                        },
                    });
                } else {
                    updateSlide(presentationId, slideId, { imageUrl: data.url });
                }
                setError('');
            } else {
                // Update background if template is imageBackground
                if (templateType === 'imageBackground' && url) {
                    updateSlide(presentationId, slideId, {
                        imageUrl: url,
                        background: {
                            type: 'image',
                            value: url,
                        },
                    });
                } else {
                    updateSlide(presentationId, slideId, { imageUrl: url });
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

                    // Update background if template is imageBackground
                    if (templateType === 'imageBackground') {
                        updateSlide(presentationId, slideId, {
                            imageUrl: data.url,
                            background: {
                                type: 'image',
                                value: data.url,
                            },
                        });
                    } else {
                        updateSlide(presentationId, slideId, { imageUrl: data.url });
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
                            value={backgroundColor || DEFAULT_BACKGROUND_COLOR}
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
                        onChange={handleTextColorChange}
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
                        aria-label="Выровнять по верхнему краю"
                        title="Вверх"
                    >
                        <MdOutlineVerticalAlignTop size={16} />
                    </button>
                    <button
                        onClick={() => handleContentAlignmentChange('center')}
                        className={`${styles.button} ${contentAlignment === 'center' ? styles.active : ''}`}
                        aria-label="Выровнять по центру"
                        title="По центру"
                    >
                        <MdOutlineVerticalAlignCenter size={16} />
                    </button>
                    <button
                        onClick={() => handleContentAlignmentChange('bottom')}
                        className={`${styles.button} ${contentAlignment === 'bottom' ? styles.active : ''}`}
                        aria-label="Выровнять по нижнему краю"
                        title="Вниз"
                    >
                        <MdOutlineVerticalAlignBottom size={16} />
                    </button>
                </div>
            </div>

            <div className={styles.headerFooterSection}>
                <span className={styles.headerFooterLabel}>Колонтитулы</span>
                <div className={styles.headerFooterButtons}>
                    <button
                        onClick={() => {
                            useUIStateStore.getState().setCurrentSlideId(slideId);
                            useUIStateStore.getState().setGlobalHeaderFooterModalOpen(true);
                        }}
                        className={styles.headerFooterButton}
                        aria-label="Настроить колонтитулы"
                    >
                        <HeaderFooterIcon />
                        <span>Настроить</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SlideTemplateSelector;

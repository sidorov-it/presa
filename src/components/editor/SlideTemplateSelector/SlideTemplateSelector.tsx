import React, { MutableRefObject, useCallback, useState } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SLIDE_TEMPLATES, TipTapRefs } from '@/types';
import styles from './SlideTemplateSelector.module.css';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import { MdOutlineVerticalAlignTop, MdOutlineVerticalAlignCenter, MdOutlineVerticalAlignBottom } from 'react-icons/md';

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

    const handleTemplateChange = (value: SlideTemplateType) => {
        // Set default image size based on template type
        let imageSize;
        if (value === 'imageTop' || value === 'imageBottom') {
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

    const handleTextColorChange = useCallback(
        (color: string) => {
            console.log('handleTextColorChange', color);
            const elements = usePresentationStore.getState().getSlideElements(presentationId, slideId);

            elements.forEach(element => {
                if (tiptapRefs.current?.editors[element.id]) {
                    tiptapRefs.current.editors[element.id]?.editor
                        .chain()
                        .focus(null, { scrollIntoView: false })
                        .selectAll()
                        .setColor(color)
                        .blur()
                        .run();
                }
            });

            setTextColor(color);
        },
        [tiptapRefs, presentationId, slideId]
    );

    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        updateSlide(presentationId, slideId, { imageUrl: url });

        // Update background immediately if template is imageBackground
        if (templateType === 'imageBackground' && url) {
            updateSlide(presentationId, slideId, {
                background: {
                    type: 'image',
                    value: url,
                },
            });
        }
    };

    const handleBackgroundColorChange = (color: string) => {
        // Only update background if not using image background
        if (templateType !== 'imageBackground') {
            updateSlide(presentationId, slideId, {
                background: {
                    type: 'color',
                    value: color,
                },
            });
        }
    };

    const handleContentAlignmentChange = (alignment: ContentAlignment) => {
        updateSlide(presentationId, slideId, {
            contentAlignment: alignment,
        });
    };

    const needsImage = ['imageTop', 'imageBottom', 'imageLeft', 'imageRight', 'imageBackground'].includes(templateType);
    const showBackgroundColor = templateType !== 'imageBackground';

    return (
        <div className="flex flex-col gap-2 p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-gray-700">Шаблон</h3>
                <div className="flex flex-row gap-1">
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
                <div className="flex flex-col gap-1 mt-2">
                    <label htmlFor="slide-image-url" className="text-sm font-medium text-gray-700">
                        URL изображения
                    </label>
                    <input
                        id="slide-image-url"
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={imageUrl}
                        onChange={handleImageUrlChange}
                        placeholder="https://..."
                        aria-label="URL изображения"
                    />
                </div>
            )}

            {showBackgroundColor && (
                <div className="flex flex-row mt-2 justify-between items-center">
                    <label htmlFor="slide-background-color" className="text-sm font-medium text-gray-700">
                        Цвет фона
                    </label>
                    <div className="flex items-center gap-2">
                        <ColorPicker
                            onColorChange={color => handleBackgroundColorChange(color)}
                            initialColor={backgroundColor}
                            mode="card"
                            label="Выбрать цвет фона"
                            className="w-full"
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-row mt-2 justify-between items-center">
                <label htmlFor="slide-background-color" className="text-sm font-medium text-gray-700">
                    Цвет текста
                </label>
                <div className="flex items-center gap-2">
                    <ColorPicker
                        onColorChange={color => handleTextColorChange(color)}
                        initialColor={textColor}
                        mode="card"
                        label="Выбрать цвет текста"
                        className="w-full"
                    />
                </div>
            </div>
            <div className="flex flex-row mt-2 justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Выравнивание контента</label>
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

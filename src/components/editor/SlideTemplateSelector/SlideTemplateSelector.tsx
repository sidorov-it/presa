import React from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SLIDE_TEMPLATES } from '@/types';
import styles from './SlideTemplateSelector.module.css';

type SlideTemplateType = (typeof SLIDE_TEMPLATES)[number]['value'];
type ContentAlignment = 'top' | 'center' | 'bottom';

interface SlideTemplateSelectorProps {
    presentationId: string;
    slideId: string;
}

const DEFAULT_HEIGHT_PX = 200;
const DEFAULT_BACKGROUND_COLOR = '#ffffff';

const SlideTemplateSelector: React.FC<SlideTemplateSelectorProps> = ({ presentationId, slideId }) => {
    const slide = usePresentationStore(
        React.useCallback(state => state.getSlide(presentationId, slideId), [presentationId, slideId])
    );
    const updateSlide = usePresentationStore(state => state.updateSlide);

    const templateType = slide?.templateType || 'standard';
    const imageUrl = slide?.imageUrl || '';
    const backgroundColor = slide?.background?.type === 'color' ? slide.background.value : DEFAULT_BACKGROUND_COLOR;
    const contentAlignment = slide?.contentAlignment || 'center';

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

    const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        
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
                <h3 className="text-sm font-medium text-gray-700">Template</h3>
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
                        Image URL
                    </label>
                    <input
                        id="slide-image-url"
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={imageUrl}
                        onChange={handleImageUrlChange}
                        placeholder="https://..."
                        aria-label="Image URL"
                    />
                </div>
            )}

            {showBackgroundColor && (
                <div className="flex flex-col gap-1 mt-2">
                    <label htmlFor="slide-background-color" className="text-sm font-medium text-gray-700">
                        Background Color
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="slide-background-color"
                            type="color"
                            className="h-8 w-8 rounded-md border border-gray-300 p-0.5"
                            value={backgroundColor}
                            onChange={handleBackgroundColorChange}
                            aria-label="Background Color"
                        />
                        <input
                            type="text"
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backgroundColor}
                            onChange={(e) => handleBackgroundColorChange(e)}
                            placeholder="#FFFFFF"
                            aria-label="Background Color Hex"
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-1 mt-2">
                <label className="text-sm font-medium text-gray-700">
                    Content Alignment
                </label>
                <div className="flex items-center gap-2">
                    <button
                        className={`py-1 px-3 rounded-md text-sm border ${
                            contentAlignment === 'top' 
                            ? 'bg-blue-100 border-blue-500 text-blue-700' 
                            : 'border-gray-300 text-gray-700'
                        }`}
                        onClick={() => handleContentAlignmentChange('top')}
                        aria-label="Align top"
                    >
                        Top
                    </button>
                    <button
                        className={`py-1 px-3 rounded-md text-sm border ${
                            contentAlignment === 'center' 
                            ? 'bg-blue-100 border-blue-500 text-blue-700' 
                            : 'border-gray-300 text-gray-700'
                        }`}
                        onClick={() => handleContentAlignmentChange('center')}
                        aria-label="Align center"
                    >
                        Center
                    </button>
                    <button
                        className={`py-1 px-3 rounded-md text-sm border ${
                            contentAlignment === 'bottom' 
                            ? 'bg-blue-100 border-blue-500 text-blue-700' 
                            : 'border-gray-300 text-gray-700'
                        }`}
                        onClick={() => handleContentAlignmentChange('bottom')}
                        aria-label="Align bottom"
                    >
                        Bottom
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SlideTemplateSelector;

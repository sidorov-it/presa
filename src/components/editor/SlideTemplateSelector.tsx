import React from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { SLIDE_TEMPLATES } from '@/types';

type SlideTemplateType = (typeof SLIDE_TEMPLATES)[number]['value'];

interface SlideTemplateSelectorProps {
    presentationId: string;
    slideId: string;
}

const SlideTemplateSelector: React.FC<SlideTemplateSelectorProps> = ({ presentationId, slideId }) => {
    const slide = usePresentationStore(
        React.useCallback(state => state.getSlide(presentationId, slideId), [presentationId, slideId])
    );
    const updateSlide = usePresentationStore(state => state.updateSlide);

    const templateType = slide?.templateType || 'standard';
    const imageUrl = slide?.imageUrl || '';

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as SlideTemplateType;

        // Set default image size based on template type
        let imageSize;
        if (value === 'imageTop' || value === 'imageBottom') {
            imageSize = { height: '33%' };
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
                    value: '#ffffff',
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

    const needsImage = ['imageTop', 'imageBottom', 'imageLeft', 'imageRight', 'imageBackground'].includes(templateType);

    return (
        <div className="flex flex-col gap-2 p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex flex-col gap-1">
                <label htmlFor="slide-template-select" className="text-sm font-medium text-gray-700">
                    Slide Template
                </label>
                <select
                    id="slide-template-select"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={templateType}
                    onChange={handleTemplateChange}
                    aria-label="Select slide template"
                >
                    {SLIDE_TEMPLATES.map(t => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
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
        </div>
    );
};

export default SlideTemplateSelector;

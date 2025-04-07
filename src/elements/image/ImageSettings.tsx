import React from 'react';
import { ImageElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';

interface ImageSettingsProps {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    onUpdate: (updates: Partial<ImageElement>) => void;
}

const ImageSettings: React.FC<ImageSettingsProps> = ({ elementId, presentationId, slideId, layoutId, onUpdate }) => {
    const element = usePresentationStore((state) => state.getElement(presentationId, slideId, layoutId, elementId));

    const updateElement = usePresentationStore((state) => state.updateElement);

    const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateElement(presentationId, slideId, layoutId, elementId, { src: e.target.value });
    };

    const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateElement(presentationId, slideId, layoutId, elementId, { alt: e.target.value });
    };

    const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
        updateElement(presentationId, slideId, layoutId, elementId, { alignment });
    };

    return (
        <div className="space-y-4 p-4">
            <div className="space-y-2">
                <label htmlFor="image-url" className="block text-sm font-medium">
                    Image URL
                </label>
                <input
                    id="image-url"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={element.src || ''}
                    onChange={handleSrcChange}
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="image-alt" className="block text-sm font-medium">
                    Alt Text
                </label>
                <input
                    id="image-alt"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={element.alt || ''}
                    onChange={handleAltChange}
                    placeholder="Image description"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium">
                    Alignment
                </label>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        className={`px-4 py-2 border rounded-md ${element.alignment === 'left' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleAlignmentChange('left')}
                        aria-label="Align left"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleAlignmentChange('left')}
                    >
                        Left
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 border rounded-md ${element.alignment === 'center' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleAlignmentChange('center')}
                        aria-label="Align center"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleAlignmentChange('center')}
                    >
                        Center
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 border rounded-md ${element.alignment === 'right' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleAlignmentChange('right')}
                        aria-label="Align right"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleAlignmentChange('right')}
                    >
                        Right
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageSettings; 
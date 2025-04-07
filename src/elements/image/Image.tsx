'use client'
import React, { useState } from 'react';
import { ImageElement } from '@/types';
import { default as ImageComponent } from 'next/image'

interface ImageProps {
  element: ImageElement;
  className?: string;
}

const Image: React.FC<ImageProps> = ({ element, className = '' }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setError('Failed to load image');
    };

    // Get alignment style based on element alignment property
    const getAlignmentClass = () => {
        switch (element.alignment) {
            case 'left':
                return 'mr-auto';
            case 'center':
                return 'mx-auto';
            case 'right':
                return 'ml-auto';
            default:
                return 'mx-auto'; // Default to center alignment
        }
    };

    const isValideUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    };

    return (
        <div className={`relative w-full ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="text-red-500 text-center p-4 border border-red-200 rounded">
                    {error}
                </div>
            )}

            {element.src && isValideUrl(element.src) && (
                <ImageComponent
                    src={element.src || ''}
                    alt={element.alt || ''}
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: '100%', height: 'auto' }} // optional                                      className={`max-w-full h-auto rounded shadow-sm ${getAlignmentClass()} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
            )}

            {(!element.src || !isValideUrl(element.src)) && (
                <div className="text-gray-500 text-center p-4 border border-gray-200 rounded">
                    {element.alt || 'Изображение не найдено'}
                </div>
            )}

        </div>
    );
};

export default Image;
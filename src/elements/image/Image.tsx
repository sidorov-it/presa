'use client'
import React, { useState, useRef, useEffect } from 'react';
import { ImageElement } from '@/types';
import { default as ImageComponent } from 'next/image'
import { usePresentationStore } from '@/store/presentationStore';

interface ImageProps {
  element: ImageElement;
  className?: string;
  presentationId?: string;
  slideId?: string;
  layoutId?: string;
}

const Image: React.FC<ImageProps> = ({ 
  element, 
  className = '', 
  presentationId, 
  slideId, 
  layoutId 
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSelected, setIsSelected] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [resizing, setResizing] = useState(false);
    const [startWidth, setStartWidth] = useState(0);
    const [startX, setStartX] = useState(0);

    const updateElement = usePresentationStore(state => state.updateElement);

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setError('Failed to load image');
    };

    const handleClickImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSelected(true);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsSelected(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle resize start
    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(true);
        setStartWidth(containerRef.current?.clientWidth || 0);
        setStartX(e.clientX);
    };

    // Handle resize movement
    const handleResizeMove = (e: MouseEvent) => {
        if (!resizing) return;
        
        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;
        
        // Ensure minimum width (100px)
        const width = Math.max(100, newWidth);
        
        // Update container max-width in the DOM
        if (containerRef.current) {
            containerRef.current.style.maxWidth = `${width}px`;
        }
    };

    // Handle resize end
    const handleResizeEnd = () => {
        if (!resizing) return;
        
        setResizing(false);
        
        // Save the new width to the element data
        if (containerRef.current && presentationId && slideId && layoutId) {
            const newWidth = containerRef.current.clientWidth;
            updateElement(
                presentationId,
                slideId,
                layoutId,
                element.id,
                { width: newWidth }
            );
        }
    };

    useEffect(() => {
        if (resizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [resizing]);

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

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    };

    return (
        <div 
            ref={containerRef}
            className={`relative ${className} ${getAlignmentClass()}`} 
            style={{ 
                maxWidth: element.width ? `${element.width}px` : '100%',
                cursor: isSelected ? 'move' : 'pointer'
            }}
            onClick={handleClickImage}
        >
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

            {isSelected && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none z-10"></div>
            )}

            {element.src && isValidUrl(element.src) && (
                <div className="relative w-full">
                    <ImageComponent
                        src={element.src || ''}
                        alt={element.alt || ''}
                        width={0}
                        height={0}
                        sizes="100vw"
                        style={{ width: '100%', height: 'auto' }}
                        className={`rounded shadow-sm ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                    
                    {isSelected && (
                        <>
                            {/* Resize handle - right */}
                            <div 
                                className="absolute top-0 right-0 bottom-0 w-4 cursor-e-resize z-20"
                                onMouseDown={(e) => handleResizeStart(e, 'right')}
                            />
                            {/* Resize handle - left */}
                            <div 
                                className="absolute top-0 left-0 bottom-0 w-4 cursor-w-resize z-20"
                                onMouseDown={(e) => handleResizeStart(e, 'left')}
                            />
                            {/* Resize corner handle */}
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full opacity-75 cursor-se-resize z-20"
                                onMouseDown={(e) => handleResizeStart(e, 'corner')}
                            />
                        </>
                    )}
                </div>
            )}

            {(!element.src || !isValidUrl(element.src)) && (
                <div className="text-gray-500 text-center p-4 border border-gray-200 rounded">
                    {element.alt || 'Изображение не найдено'}
                </div>
            )}
        </div>
    );
};

export default Image;
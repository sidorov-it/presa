/* eslint-disable @next/next/no-img-element */
import { Element } from '@/types';
import { ViewerElement } from '@/types/elements';

interface ElementViewerProps {
    element: Element & ViewerElement;
    slideId: string;
    layoutId: string;
}

const ElementViewer = ({ element }: ElementViewerProps) => {
    // Render element based on its type
    const renderElementContent = () => {
        console.log(element.elementTypeId);
        switch (element.elementTypeId) {
            case 'text':
            case 'heading':
            case 'paragraph':
            case 'editor':
                // For text elements, render HTML content from 'content' property
                return (
                    <div className="w-full h-full tiptap" dangerouslySetInnerHTML={{ __html: element.content || '' }} />
                );

            case 'image':
                // For image elements, render the image
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <img
                            src={element.url || ''}
                            alt={element.alt || 'Presentation image'}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                );

            default:
                // For unsupported element types, render a placeholder
                return (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Unsupported element type
                    </div>
                );
        }
    };

    return (
        <div
            className="w-full h-full"
            style={{
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                transform: 'none',
                // opacity: element.opacity !== undefined ? element.opacity : 1,
            }}
        >
            {renderElementContent()}
        </div>
    );
};

export default ElementViewer;

import { ImageElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { useMenuStore } from '@/store/menuStore';
import { useAIImageStore } from '@/store/aiImageStore';
import ImageComponent from './ImageComponent';

interface ImageProps {
    elementId: string;
    className?: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    hasMultipleCells?: boolean;
}

export default function Image({
    elementId,
    className = '',
    presentationId,
    slideId,
    layoutId,
    hasMultipleCells,
}: ImageProps) {
    const element = usePresentationStore(state =>
        state.getElement(presentationId, slideId, layoutId, elementId)
    ) as ImageElement;
    const updateElement = usePresentationStore(state => state.updateElement);
    const addColumnsAroundImage = usePresentationStore(
        state => state.addColumnsAroundImage
    );
    const openMenu = useMenuStore(state => state.openMenu);
    const aiImageStore = useAIImageStore();
    const isGenerating = aiImageStore.isGenerating(elementId);

    return (
        <ImageComponent
            element={element}
            className={className}
            presentationId={presentationId}
            slideId={slideId}
            layoutId={layoutId}
            hasMultipleCells={hasMultipleCells}
            isGenerating={isGenerating}
            openMenu={openMenu}
            updateElement={(data: Partial<ImageElement>) =>
                updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data,
                })
            }
            addColumnsAroundImage={options =>
                addColumnsAroundImage(presentationId, slideId, layoutId, options)
            }
        />
    );
}

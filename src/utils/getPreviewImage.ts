import { IPresentation, Layout, BaseElement, SmartLayoutElement } from '@/types';
import { ElementType } from '@/types/elements';

export default function getPreviewImage(presentation: IPresentation): string | null {
    if (!presentation?.slides?.length) return null;
    const firstSlide = presentation.slides[0];

    // Check slide imageUrl property
    if (firstSlide.imageUrl) {
        return firstSlide.imageUrl;
    }

    // Check slide background image
    if (firstSlide.background?.type === 'image') {
        return firstSlide.background.value;
    }

    if (!firstSlide.layouts) {
        return null;
    }

    // Scan layouts for image elements
    for (const layout of firstSlide.layouts as Layout[]) {
        for (const element of layout.elements as BaseElement[]) {
            if (element.elementTypeId === ElementType.IMAGE && (element as any).src) {
                return (element as any).src as string;
            }
            if (element.elementTypeId === ElementType.SMART_LAYOUT) {
                const smart = element as SmartLayoutElement;
                const itemWithImage = smart.items.find(item => item.imageUrl);
                if (itemWithImage && itemWithImage.imageUrl) return itemWithImage.imageUrl;
            }
        }
    }

    return null;
}

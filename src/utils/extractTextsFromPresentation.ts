import { IPresentation, Element, Slide, SlideText } from '@/types';
import extractTextFromElement from './extractTextFromElement';

export default function extractTextsFromPresentation(presentation: IPresentation) {
    const slideTexts: SlideText[] = presentation.slides
        .map((slide: Slide) => ({
            slideId: slide.id,
            text: slide.layouts
                .flatMap(layout => layout.elements)
                .map(element => extractTextFromElement(element as unknown as Element))
                .join('\n'),
        }))
        .filter((slideText: SlideText) => slideText.text.length > 0);

    return slideTexts;
}

import { generatePresentationTemplate, PresentationDescriptor } from './generator';

describe('generatePresentationTemplate', () => {
    it('creates presentation from descriptor', () => {
        const descriptor: PresentationDescriptor = {
            title: 'Test Presentation',
            slides: [
                {
                    title: 'Slide 1',
                    layouts: [
                        {
                            elements: [{ type: 'text', content: 'Hello world' }],
                        },
                    ],
                },
            ],
        };

        const presentation = generatePresentationTemplate(descriptor);

        expect(presentation.title).toBe('Test Presentation');
        expect(presentation.slides.length).toBe(1);
        expect(presentation.slides[0].layouts.length).toBe(1);
        expect(presentation.slides[0].layouts[0].elements.length).toBe(1);
        expect(presentation.slides[0].layouts[0].elements[0].elementTypeId).toBe('text');
    });
});

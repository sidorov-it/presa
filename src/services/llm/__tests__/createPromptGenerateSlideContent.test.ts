// Mocks for heavy dependencies that are not needed in this unit-test environment
jest.mock('@/services/llm', () => ({
    createLLMService: () => ({
        generate: jest.fn(),
    }),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {},
}));

import {
    createGenerateSlideContentFunction,
    createPromptGenerateSlideContent,
} from '@/services/llm/generateSlideContent';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';

/**
 * Basic smoke-tests for `createPromptGenerateSlideContent`.
 * The goal is to make sure that the function:
 * 1. Does not throw for any active template from `SlideTemplatesRegistry`.
 * 2. Returns a non-empty prompt string.
 * 3. Mentions every unique slot (or smart-layout item key) that will later be
 *    consumed by the LLM in the generated prompt's «Структура слайда» section.
 */

describe('createPromptGenerateSlideContent', () => {
    const commonArgs = {
        topic: 'Тестовая тема',
        slideIndex: 0,
        totalSlides: 1,
    } as const;

    Object.entries(SlideTemplatesRegistry).forEach(([templateId, template]) => {
        if (template.disabled) {
            return; // skip templates explicitly marked as disabled
        }

        it(`generates correct prompt for active template "${templateId}"`, () => {
            const { slotMapping } = createGenerateSlideContentFunction(template);

            const prompt = createPromptGenerateSlideContent({
                ...commonArgs,
                template,
                slotsMapping: slotMapping,
            });

            // 1. Prompt is a non-empty string
            expect(typeof prompt).toBe('string');
            expect(prompt.length).toBeGreaterThan(0);

            // 2. Prompt contains the mandatory heading section
            expect(prompt).toContain('Структура слайда');

            // 3. Every slot that we pass to the description must be present
            Array.from(slotMapping.values()).forEach(slot => {
                if (slot.items && Array.isArray(slot.items)) {
                    slot.items.forEach(item => {
                        expect(prompt).toContain(item.key);
                    });
                } else {
                    expect(prompt).toContain(slot.uniqueKey);
                }
            });
        });
    });
});

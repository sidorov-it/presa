// src/services/llm/slideGenerator.ts

import { LLMService, SlideGenerationContext } from '@/types/llm';

export class SlideContentGenerator {
    constructor(private llmService: LLMService) {}

    private generatePrompt(templateId: string, context: SlideGenerationContext): string {
        const { topic, audience, style, slideIndex, totalSlides, instructions } = context;

        const basePrompt = `Create content for slide ${slideIndex} of ${totalSlides}.

Topic: "${topic}"
Target audience: ${audience}
Style: ${style}
${instructions ? `Special instructions: ${instructions}` : ''}

Please generate content for this slide that:
1. Clearly explains the topic
2. Is appropriate for the target audience
3. Follows the specified style
4. Is concise and impactful
5. Flows naturally with other slides
${instructions ? '6. Follows the special instructions provided' : ''}

Format your response as follows:
- For text elements: Write the content directly
- For image elements: Start with "Image:" followed by a detailed description

The content should be structured and easy to parse. Each element should be separated by two newlines.

Generate the content now:`;

        return basePrompt;
    }

    async generateContent(templateId: string, context: SlideGenerationContext) {
        try {
            const prompt = this.generatePrompt(templateId, context);
            const response = await this.llmService.generate(prompt);

            // Transform the LLM response into slide elements with proper positioning
            const transformedElements = response.elements.map(element => ({
                type: element.type,
                props: {
                    content: element.content,
                    ...element.metadata,
                },
            }));

            return {
                elements: transformedElements,
            };
        } catch (error) {
            console.error('Error generating slide content:', error);
            throw new Error('Failed to generate slide content');
        }
    }
}

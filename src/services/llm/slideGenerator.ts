// src/services/llm/slideGenerator.ts

import { SlideTemplatesRegistry } from '@/templates/slideTemplates';
import { TemplateTransformers } from '@/templates/transformers';
import { SlideTemplateCore } from '@/types/templates';

interface GenerationContext {
    topic: string;
    audience: string;
    style: string;
    slideIndex: number;
    totalSlides: number;
    previousContent?: any;
}

export class SlideContentGenerator {
    constructor(private llmService: any) {} // Ваш сервис для работы с LLM

    async generateContent(templateId: string, context: GenerationContext) {
        const template = SlideTemplatesRegistry[templateId];
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        const llmTemplate = TemplateTransformers.toLLMTemplate(template);

        const prompt = this.buildPrompt(llmTemplate, context);
        const response = await this.llmService.generate(prompt);

        return this.validateAndTransform(response, template);
    }

    private buildPrompt(
        template: ReturnType<typeof TemplateTransformers.toLLMTemplate>,
        context: GenerationContext
    ): string {
        return `
  Создайте контент для слайда "${template.name}" (${context.slideIndex} из ${context.totalSlides})
  
  Тема презентации: ${context.topic}
  Аудитория: ${context.audience}
  Стиль: ${context.style}
  
  Описание шаблона: ${template.description}
  Назначение: ${template.purpose.join(', ')}
  
  Требуемые элементы:
  ${template.slots
        .map(
            slot => `
  - Тип: ${slot.type}
    Позиция: ${slot.position}
    Назначение: ${slot.hints?.purpose}
    Правила: ${slot.hints?.contextRules?.join(', ')}
    ${slot.constraints ? `Ограничения: ${JSON.stringify(slot.constraints)}` : ''}
  `
        )
        .join('\n')}
  
  Пожалуйста, сгенерируйте контент для каждого элемента, учитывая:
  1. Общий контекст презентации
  2. Специфику аудитории
  3. Выбранный стиль
  4. Взаимосвязь элементов
  
  Верните результат в формате JSON:
  {
    "elements": [
      {
        "type": "string",
        "content": "string",
        "metadata": {} // Дополнительные метаданные если нужны
      }
    ]
  }`;
    }

    private validateAndTransform(llmResponse: any, template: SlideTemplateCore) {
        // Проверка и преобразование ответа LLM в формат,
        // подходящий для вашего редактора слайдов
        const result: any = {
            elements: [],
        };

        for (const element of template.elements) {
            const llmElement = llmResponse.elements.find((e: any) => e.type === element.type);

            if (!llmElement && element.constraints?.required) {
                throw new Error(`Missing required content for ${element.type}`);
            }

            if (llmElement) {
                // Проверка ограничений
                if (element.constraints?.maxLength && llmElement.content.length > element.constraints.maxLength) {
                    throw new Error(`Content for ${element.type} exceeds maxLength`);
                }

                result.elements.push({
                    type: element.type,
                    props: {
                        ...element.props,
                        ...(element.type === 'text'
                            ? { content: llmElement.content }
                            : element.type === 'image'
                              ? { alt: llmElement.content } // Для изображений контент становится alt-текстом
                              : { content: llmElement.content }),
                    },
                });
            }
        }

        return result;
    }
}

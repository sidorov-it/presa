export interface LLMResponse {
    elements: SlideElement[];
    function_call?: {
        name: string;
        arguments: any;
    };
}

export interface SlideElement {
    type: 'text' | 'image';
    content: string;
    metadata: Record<string, any>;
}

export interface LLMService {
    generate(prompt: string, options?: { functions?: any[]; function_call?: any }): Promise<LLMResponse>;
}

export interface SlideGenerationContext {
    topic: string;
    audience: string;
    style: string;
    slideIndex: number;
    totalSlides: number;
    previousContent?: any;
    instructions?: string;
}

export interface GigaChatConfig {
    userId: string;
}

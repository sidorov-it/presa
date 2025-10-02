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
    generate(
        prompt: string,
        options?: {
            functions?: any[];
            function_call?: any;
            presentationId?: string;
            /** If true, the LLM **must** invoke the specified function. */
            requireFunctionCall?: boolean;
            /** Internal counter to prevent infinite retries when the function is not invoked by the LLM. */
            __attemptCount?: number;
        }
    ): Promise<LLMResponse>;
    // Optional image generation capability. Not all providers implement this method.
    generateImage?(
        prompt: string,
        options: { presentationId?: string; userId: string }
    ): Promise<{ imageUrl: string; imageId: string }>;

    getTokensCount(text: string): Promise<number>;
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

// Configuration for YaGPT initialization
export interface YaGptConfig {
    userId: string;
}

// Configuration for Mock LLM initialization
export interface MockGptConfig {
    userId: string;
}

export type SupportedLLMProvider = 'gigachat' | 'yagpt' | 'mock';

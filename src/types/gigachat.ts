import { Agent } from 'https';
import { TemplateElement, TextType } from '@/types/templates';
import { ElementType } from '@/types/elements';

export interface GigaChatConfig {
    credentials: string;
    systemPrompt?: string;
    timeout?: number;
    model?: string;
    httpsAgent?: Agent;
}

export interface GigaChatImageResponse {
    imageUrl: string;
    imageId: string;
}

export interface SlotContent {
    key: string;
    value: {
        type: 'string' | 'smart-layout';
        stringContent?: string;
        items?: Array<Record<string, string>>;
    };
}

export interface SmartLayoutContent {
    items: Array<Record<string, string>>;
}

export interface SlotKeyMapping {
    uniqueKey: string;
    layoutIndex: number;
    elementIndex: number;
    originalSlot: string;
    llmHints?: TemplateElement['llmHints'];
    items?: Array<{
        key: string;
        originalKey: string;
        type: string;
        description: string;
        contextRules?: string[];
    }>;
    column?: number;
    elementTypeId?: ElementType;
    textType?: TextType;
}

export interface LLMRequestContext {
    presentationId?: string;
    slideId?: string;
    userId: string;
    requestId: string;
}

import { Agent } from 'https';
import { TemplateElement } from './templates';
import { TextType } from '.';

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
    items?: Array<Record<string, TemplateElement['llmHints']>>;
    column?: number;
    textType?: TextType;
}

export interface LLMRequestContext {
    presentationId?: string;
    slideId?: string;
    userId: string;
    requestId: string;
}

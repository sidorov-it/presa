export interface LLMRecording {
    timestamp: number;
    prompt: string;
    options?: any;
    response: {
        type: 'chat' | 'image';
        data: any;
    };
    inputTokens: number; // количество входящих токенов
    outputTokens: number; // количество исходящих токенов
    requestId: string; // идентификатор пользовательского запроса
}

export interface LLMRecordingStorage {
    recordings: LLMRecording[];
    version: string;
}

export interface RecordingOptions {
    enabled?: boolean;
    storageKey?: string;
    replayMode?: boolean;
}

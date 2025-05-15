export interface LLMRecording {
    timestamp: number;
    prompt: string;
    options?: any;
    response: {
        type: 'chat' | 'image';
        data: any;
    };
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

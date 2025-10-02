import { LLMRecording, LLMRecordingStorage } from '@/types/llm/recordings';
import fs from 'fs/promises';
import path from 'path';

export class RecordingService {
    private storageKey: string;
    private recordings: LLMRecording[] = [];
    private readonly version = '1.0.0';

    constructor(storageKey: string = 'default') {
        this.storageKey = storageKey;
    }

    async saveRecording(recording: Omit<LLMRecording, 'timestamp'>): Promise<void> {
        const newRecording: LLMRecording = {
            ...recording,
            timestamp: Date.now(),
        };

        this.recordings.push(newRecording);
        await this.persistRecordings();
    }

    /**
     * Сохраняет запись с явными параметрами (для удобства)
     */
    async saveDetailedRecording(params: {
        prompt: string;
        response: { type: 'chat' | 'image'; data: any };
        options?: any;
        inputTokens: number;
        outputTokens: number;
        requestId: string;
    }): Promise<void> {
        const newRecording: LLMRecording = {
            ...params,
            timestamp: Date.now(),
        };
        this.recordings.push(newRecording);
        await this.persistRecordings();
    }

    async findRecordingByPrompt(prompt: string): Promise<LLMRecording | null> {
        await this.loadRecordings();
        return this.recordings.findLast(r => r.prompt.includes(prompt)) || null;
    }

    async findRecording(prompt: string, options?: any): Promise<LLMRecording | null> {
        await this.loadRecordings();
        return (
            this.recordings.find(r => r.prompt === prompt && JSON.stringify(r.options) === JSON.stringify(options)) ||
            null
        );
    }

    /**
     * Поиск всех записей по requestId (все LLM-запросы, относящиеся к одному пользовательскому запросу)
     */
    async findRecordingsByRequestId(requestId: string): Promise<LLMRecording[]> {
        await this.loadRecordings();
        return this.recordings.filter(r => r.requestId === requestId);
    }

    private async persistRecordings(): Promise<void> {
        const storage: LLMRecordingStorage = {
            recordings: this.recordings,
            version: this.version,
        };

        const recordingsDir = path.join(process.cwd(), 'test', 'recordings');
        const filePath = path.join(recordingsDir, `${this.storageKey}.json`);

        try {
            await fs.mkdir(recordingsDir, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(storage, null, 2));
        } catch (error) {
            console.error('Failed to persist recordings:', error);
            throw error;
        }
    }

    private async loadRecordings(): Promise<void> {
        const filePath = path.join(process.cwd(), 'test', 'recordings', `${this.storageKey}.json`);

        try {
            const data = await fs.readFile(filePath, 'utf-8');
            const storage: LLMRecordingStorage = JSON.parse(data);

            if (storage.version === this.version) {
                this.recordings = storage.recordings;
            } else {
                console.warn('Recording version mismatch, using empty recordings');
                this.recordings = [];
            }
        } catch (error) {
            // If file doesn't exist, start with empty recordings
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                this.recordings = [];
            } else {
                console.error('Failed to load recordings:', error);
                throw error;
            }
        }
    }

    async clearRecordings(): Promise<void> {
        this.recordings = [];
        await this.persistRecordings();
    }
}

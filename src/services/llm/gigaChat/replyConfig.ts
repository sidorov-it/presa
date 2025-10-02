import { RecordingOptions } from '@/types/llm/recordings';

export const replyConfig: RecordingOptions = {
    replayMode: process.env.NODE_ENV === 'development',
    storageKey: 'test',
    enabled: true,
};

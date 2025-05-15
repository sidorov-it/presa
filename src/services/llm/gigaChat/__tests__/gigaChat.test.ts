import { GigaChatService } from '../gigaChat';
import fs from 'fs/promises';
import path from 'path';

describe('GigaChatService', () => {
    const recordingsPath = path.join(process.cwd(), 'test', 'recordings', 'test.json');

    beforeEach(async () => {
        try {
            await fs.unlink(recordingsPath);
        } catch (error) {
            // Ignore if file doesn't exist
        }
    });

    it('should record and replay LLM responses', async () => {
        // First, create a service with recording enabled
        const recordingService = new GigaChatService(
            { authKey: 'test-key' },
            { enabled: true, storageKey: 'test' }
        );

        // Make a call that will be recorded
        const prompt = 'Create a presentation about cats';
        const response = await recordingService.generate(prompt);

        // Now create a service in replay mode without fallback
        const replayService = new GigaChatService(
            { authKey: 'test-key' },
            { replayMode: true, storageKey: 'test' }
        );

        // The replay service should return the same response without making an API call
        const replayResponse = await replayService.generate(prompt);
        expect(replayResponse).toEqual(response);

        // Should throw error for unknown prompt without fallback
        await expect(replayService.generate('Unknown prompt')).rejects.toThrow(
            'No recorded response found for prompt in replay mode and fallback is disabled'
        );
    });

    it('should fallback to real API call when recording not found', async () => {
        // Create a service with recording enabled
        const recordingService = new GigaChatService(
            { authKey: 'test-key' },
            { enabled: true, storageKey: 'test' }
        );

        // Make a call that will be recorded
        const prompt = 'Create a presentation about cats';
        const response = await recordingService.generate(prompt);

        // Create a service in replay mode with fallback enabled
        const replayService = new GigaChatService(
            { authKey: 'test-key' },
            { replayMode: true, storageKey: 'test' }
        );

        // Should return recorded response for known prompt
        const replayResponse = await replayService.generate(prompt);
        expect(replayResponse).toEqual(response);

        // Should make real API call for unknown prompt
        const newPrompt = 'Create a presentation about dogs';
        const newResponse = await replayService.generate(newPrompt);
        expect(newResponse).toBeDefined();

        // The new response should now be recorded
        const secondReplayResponse = await replayService.generate(newPrompt);
        expect(secondReplayResponse).toEqual(newResponse);
    });

    it('should record and replay image generation with fallback', async () => {
        // Create a service with recording enabled
        const recordingService = new GigaChatService(
            { authKey: 'test-key' },
            { enabled: true, storageKey: 'test' }
        );

        // Generate an image that will be recorded
        const prompt = 'A cute cat';
        const response = await recordingService.generateImage(prompt);

        // Create a service in replay mode with fallback
        const replayService = new GigaChatService(
            { authKey: 'test-key' },
            { replayMode: true, fallbackToReal: true, storageKey: 'test' }
        );

        // Should return recorded response for known prompt
        const replayResponse = await replayService.generateImage(prompt);
        expect(replayResponse).toEqual(response);

        // Should make real API call for unknown prompt
        const newPrompt = 'A cute dog';
        const newResponse = await replayService.generateImage(newPrompt);
        expect(newResponse).toBeDefined();
        expect(newResponse.imageId).toBeDefined();
    });
}); 
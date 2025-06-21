import { RateLimiter } from '../rateLimiter';

export class TestRateLimiterService {
    private rateLimiter: RateLimiter;

    constructor(limit: number = 2) {
        this.rateLimiter = new RateLimiter(limit);
    }

    async simulateApiCall(
        delay: number = 10000,
        shouldFail: boolean = false
    ): Promise<{ timestamp: number; message: string }> {
        return this.rateLimiter.run(async () => {
            // Simulate API call with delay
            await new Promise(resolve => setTimeout(resolve, delay));

            if (shouldFail) {
                throw new Error('Simulated API failure');
            }

            return {
                timestamp: Date.now(),
                message: `API call completed after ${delay}ms delay`,
            };
        });
    }

    async processBatch(count: number, delay: number = 1000): Promise<Array<{ timestamp: number; message: string }>> {
        const promises = Array(count)
            .fill(null)
            .map(() => this.simulateApiCall(delay));

        return Promise.all(promises);
    }
}

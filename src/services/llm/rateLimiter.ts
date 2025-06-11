export class RateLimiter {
    private activeCount = 0;
    private queue: (() => void)[] = [];

    constructor(private readonly limit: number) {}

    async run<T>(fn: () => Promise<T>): Promise<T> {
        if (this.activeCount >= this.limit) {
            await new Promise<void>(resolve => this.queue.push(resolve));
        }
        this.activeCount++;
        try {
            const result = await fn();
            return result;
        } finally {
            this.activeCount--;
            const next = this.queue.shift();
            if (next) next();
        }
    }
}

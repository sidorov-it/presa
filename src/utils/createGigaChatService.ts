import { GigaChatService } from '@/services/llm/gigaChat/gigaChat';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Создает экземпляр GigaChatService с userId из текущей сессии
 */
export async function createGigaChatService() {
    if (!process.env.GIGACHAT_API_KEY || !process.env.GIGACHAT_AUTH_KEY || !process.env.GIGACHAT_SCOPE) {
        throw new Error('GIGACHAT_API_KEY, GIGACHAT_AUTH_KEY, and GIGACHAT_SCOPE environment variables are not set');
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('User not authenticated');
    }

    return new GigaChatService({
        apiKey: process.env.GIGACHAT_API_KEY!,
        authKey: process.env.GIGACHAT_AUTH_KEY!,
        scope: process.env.GIGACHAT_SCOPE,
        userId: session.user.id,
    });
}

/**
 * Создает экземпляр GigaChatService с заданным userId
 */
export function createGigaChatServiceWithUserId(userId: string) {
    return new GigaChatService({
        apiKey: process.env.GIGACHAT_API_KEY!,
        authKey: process.env.GIGACHAT_AUTH_KEY!,
        scope: process.env.GIGACHAT_SCOPE,
        userId,
    });
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createLLMService } from '@/services/llm';

/**
 * Создает экземпляр GigaChatService с userId из текущей сессии
 */
export async function createGigaChatService() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('User not authenticated');
    }

    return createLLMService({ userId: session.user.id });
}

/**
 * Создает экземпляр GigaChatService с заданным userId
 */
export function createGigaChatServiceWithUserId(userId: string) {
    return createLLMService({ userId });
}

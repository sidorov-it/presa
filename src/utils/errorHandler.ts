import { NextResponse } from 'next/server';
import logger from './logger';

export interface ErrorInfo {
    message: string;
    stack?: string;
    cause?: any;
    [key: string]: any;
}

/**
 * Стандартный обработчик ошибок для логирования ошибок с сообщением и stacktrace
 * @param error - Объект ошибки
 * @param context - Дополнительный контекст для логирования
 * @param operation - Название операции, в которой произошла ошибка
 */
export const handleError = (error: unknown, context?: string, operation?: string): void => {
    const errorInfo: ErrorInfo = {
        message: 'Unknown error occurred',
    };

    // Извлекаем информацию об ошибке
    if (error instanceof Error) {
        errorInfo.message = error.message;
        errorInfo.stack = error.stack;
        errorInfo.cause = error.cause;
    } else if (typeof error === 'string') {
        errorInfo.message = error;
    } else if (error && typeof error === 'object') {
        // Для объектов ошибок, которые не являются экземплярами Error
        errorInfo.message = (error as any).message || String(error);
        errorInfo.stack = (error as any).stack;
        errorInfo.cause = (error as any).cause;
    }

    // Формируем сообщение для логирования
    const logMessage = [
        context && `Context: ${context}`,
        operation && `Operation: ${operation}`,
        `Error: ${errorInfo.message}`,
    ]
        .filter(Boolean)
        .join(' | ');

    // Логируем ошибку с полной информацией
    logger.error(logMessage, {
        error: errorInfo,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Обработчик ошибок для API маршрутов с возвратом стандартного ответа
 * @param error - Объект ошибки
 * @param context - Дополнительный контекст для логирования
 * @param operation - Название операции, в которой произошла ошибка
 * @returns NextResponse с ошибкой 500
 */
export const handleApiError = (error: unknown, context?: string, operation?: string): NextResponse => {
    handleError(error, context, operation);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
};

/**
 * Обработчик ошибок с кастомным сообщением для пользователя
 * @param error - Объект ошибки
 * @param userMessage - Сообщение для пользователя
 * @param statusCode - HTTP статус код
 * @param context - Дополнительный контекст для логирования
 * @param operation - Название операции, в которой произошла ошибка
 * @returns NextResponse с кастомной ошибкой
 */
export const handleApiErrorWithCustomMessage = (
    error: unknown,
    userMessage: string,
    statusCode: number = 500,
    context?: string,
    operation?: string
): NextResponse => {
    handleError(error, context, operation);

    return NextResponse.json({ error: userMessage }, { status: statusCode });
};

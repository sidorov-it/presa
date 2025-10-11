/**
 * ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ системы логирования ошибок
 * 
 * Этот файл содержит примеры - не включен в сборку
 */

import { logCaughtError, getErrorMessage } from '@/utils/errorReporting';

// ============================================
// Пример 1: Простой API запрос
// ============================================

async function simpleApiExample() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        return data;
    } catch (error) {
        // Простое логирование без контекста
        logCaughtError(error);
        throw error;
    }
}

// ============================================
// Пример 2: API запрос с контекстом
// ============================================

async function apiWithContextExample(presentationId: string) {
    try {
        const response = await fetch(`/api/presentations/${presentationId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        // Логирование с контекстом действия и дополнительной информацией
        logCaughtError(error, {
            action: 'Загрузка презентации',
            component: 'PresentationLoader',
            additionalInfo: {
                presentationId,
                timestamp: Date.now(),
            },
        });
        
        // Показать пользователю понятное сообщение
        const message = getErrorMessage(error);
        console.error('Failed to load:', message);
        
        throw error;
    }
}

// ============================================
// Пример 3: React компонент с обработкой ошибок
// ============================================

function ExampleComponent({ presentationId }: { presentationId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await fetch('/api/save', {
                method: 'POST',
                body: JSON.stringify({ presentationId }),
            });
            
            // Успех
            toast.success('Сохранено!');
        } catch (error) {
            // Логируем с контекстом компонента
            logCaughtError(error, {
                action: 'Сохранение данных',
                component: 'ExampleComponent',
                additionalInfo: {
                    presentationId,
                    userAction: 'button_click',
                },
            });
            
            // Показываем пользователю
            const errorMessage = getErrorMessage(error);
            setError(errorMessage);
            toast.error('Не удалось сохранить');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

// ============================================
// Пример 4: Критичная операция (платежи)
// ============================================

async function criticalPaymentExample(amount: number, userId: string) {
    try {
        const response = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, userId }),
        });

        if (!response.ok) {
            throw new Error('Payment failed');
        }

        return await response.json();
    } catch (error) {
        // Для критичных операций всегда логируем с максимальным контекстом
        logCaughtError(error, {
            action: 'Обработка платежа',
            component: 'PaymentProcessor',
            additionalInfo: {
                amount,
                userId,
                currency: 'RUB',
                critical: true,
                timestamp: new Date().toISOString(),
            },
        });
        
        throw error; // Обязательно пробрасываем дальше
    }
}

// ============================================
// Пример 5: Обработка множественных ошибок
// ============================================

async function batchOperationExample(items: string[]) {
    const errors: Array<{ item: string; error: string }> = [];

    for (const item of items) {
        try {
            await processItem(item);
        } catch (error) {
            // Логируем каждую ошибку
            logCaughtError(error, {
                action: 'Обработка элемента в батче',
                additionalInfo: {
                    item,
                    batchSize: items.length,
                },
            });
            
            errors.push({
                item,
                error: getErrorMessage(error),
            });
        }
    }

    if (errors.length > 0) {
        console.warn(`${errors.length} errors occurred:`, errors);
    }

    return errors;
}

// ============================================
// Пример 6: Async/await в useEffect
// ============================================

function ComponentWithEffect({ id }: { id: string }) {
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch(`/api/data/${id}`);
                const data = await response.json();
                // Используем данные...
            } catch (error) {
                logCaughtError(error, {
                    action: 'Загрузка данных в useEffect',
                    component: 'ComponentWithEffect',
                    additionalInfo: { id },
                });
            }
        };

        loadData();
    }, [id]);

    return <div>Component content...</div>;
}

// ============================================
// Пример 7: Fallback для разных типов ошибок
// ============================================

async function robustErrorHandlingExample() {
    try {
        // Может выбросить разные типы ошибок
        await someUnpredictableOperation();
    } catch (error) {
        // getErrorMessage обрабатывает любой тип
        const message = getErrorMessage(error);
        
        logCaughtError(error, {
            action: 'Непредсказуемая операция',
            additionalInfo: {
                errorType: typeof error,
                isErrorInstance: error instanceof Error,
            },
        });
        
        return { success: false, error: message };
    }
}

// ============================================
// ИТОГО:
// ============================================
// 
// 1. Используйте logCaughtError() в catch блоках для важных операций
// 2. Добавляйте контекст (action, component, additionalInfo) для облегчения отладки
// 3. Используйте getErrorMessage() для получения читаемого сообщения
// 4. Не забывайте показывать пользователю понятные сообщения об ошибках
// 5. Для критичных операций всегда логируйте с максимальным контекстом


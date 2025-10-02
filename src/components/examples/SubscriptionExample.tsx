/**
 * Пример компонента, демонстрирующего использование системы проверки подписки
 * Этот файл служит справочником для разработчиков
 */

import { useState } from 'react';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import SubscriptionStatus from '@/components/ui/SubscriptionStatus';
import { FaCrown, FaLock } from 'react-icons/fa';
import { toast } from 'sonner';

const SubscriptionExample = () => {
    const { hasActiveSubscription, features, loading, error, refresh } = useSubscriptionCheck();
    const [selectedSlides, setSelectedSlides] = useState(5);

    // Обработчик изменения количества слайдов с проверкой лимитов
    const handleSlideCountChange = (count: number) => {
        if (count > features.maxSlides) {
            toast.error(
                `Для создания ${count} слайдов требуется подписка. ` +
                `Максимум без подписки: ${features.maxSlides} слайдов.`
            );
            return;
        }
        setSelectedSlides(count);
    };

    if (loading) {
        return <div>Загрузка статуса подписки...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '600px' }}>
            <h2>Пример использования системы подписки</h2>
            
            {/* Отображение статуса подписки */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Статус подписки:</h3>
                <SubscriptionStatus showDetails={true} size="lg" />
                {error && (
                    <p style={{ color: 'red', fontSize: '14px' }}>
                        Ошибка: {error}
                    </p>
                )}
            </div>

            {/* Информация о возможностях */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Ваши возможности:</h3>
                <ul>
                    <li>
                        Максимум слайдов: <strong>{features.maxSlides}</strong>
                        {hasActiveSubscription && <FaCrown style={{ color: '#fbbf24', marginLeft: '5px' }} />}
                    </li>
                    <li>
                        Водяной знак: {features.hideBranding ? (
                            <span style={{ color: 'green' }}>Скрыт</span>
                        ) : (
                            <span style={{ color: 'orange' }}>Отображается</span>
                        )}
                    </li>
                    <li>
                        Максимальный размер документа: <strong>{features.maxDocumentSize} MB</strong>
                    </li>
                    <li>
                        Приоритетная обработка: {features.priority ? (
                            <span style={{ color: 'green' }}>Включена</span>
                        ) : (
                            <span style={{ color: 'gray' }}>Отключена</span>
                        )}
                    </li>
                </ul>
            </div>

            {/* Пример селектора с ограничениями */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Выбор количества слайдов:</h3>
                <select
                    value={selectedSlides}
                    onChange={e => handleSlideCountChange(Number(e.target.value))}
                    style={{ padding: '8px', fontSize: '16px' }}
                >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <option 
                            key={num} 
                            value={num}
                            disabled={num > features.maxSlides}
                        >
                            {num} слайд{num > 1 ? (num < 5 ? 'а' : 'ов') : ''}
                            {num > features.maxSlides && ' (требуется подписка)'}
                        </option>
                    ))}
                </select>
                <p style={{ fontSize: '14px', color: '#666' }}>
                    Выбрано: {selectedSlides} из {features.maxSlides} доступных
                </p>
            </div>

            {/* Условные функции */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Доступные функции экспорта:</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button style={{ padding: '8px 16px' }}>
                        PDF (базовый)
                    </button>
                    
                    <button 
                        disabled={!features.customExport}
                        style={{ 
                            padding: '8px 16px',
                            opacity: features.customExport ? 1 : 0.5,
                            cursor: features.customExport ? 'pointer' : 'not-allowed'
                        }}
                    >
                        PPTX {!features.customExport && <FaLock style={{ marginLeft: '5px' }} />}
                    </button>
                    
                    <button 
                        disabled={!features.customExport}
                        style={{ 
                            padding: '8px 16px',
                            opacity: features.customExport ? 1 : 0.5,
                            cursor: features.customExport ? 'pointer' : 'not-allowed'
                        }}
                    >
                        HTML {!features.customExport && <FaLock style={{ marginLeft: '5px' }} />}
                    </button>
                </div>
            </div>

            {/* Кнопка обновления статуса */}
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={refresh}
                    style={{ 
                        padding: '8px 16px',
                        backgroundColor: '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Обновить статус подписки
                </button>
            </div>

            {/* Призыв к действию для пользователей без подписки */}
            {!hasActiveSubscription && (
                <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: '8px',
                    border: '1px solid #2196f3'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
                        <FaCrown style={{ marginRight: '8px' }} />
                        Получите больше возможностей с подпиской!
                    </h4>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                        <li>До 20 слайдов вместо {features.maxSlides}</li>
                        <li>Без водяного знака при экспорте</li>
                        <li>Дополнительные форматы экспорта</li>
                        <li>Приоритетная обработка запросов</li>
                    </ul>
                    <button style={{ 
                        padding: '8px 16px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}>
                        Оформить подписку
                    </button>
                </div>
            )}
        </div>
    );
};

export default SubscriptionExample;
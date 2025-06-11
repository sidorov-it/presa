# Система токенов для LLM

## Обзор

Система токенов позволяет контролировать использование AI-функций в приложении. Пользователи покупают токены и тратят их на генерацию слайдов, текста и изображений.

## Архитектура

### База данных

Система включает следующие модели:

- **UserTokens** - баланс токенов пользователя
- **TokenPackage** - пакеты токенов для покупки
- **TokenPurchase** - история покупок
- **TokenTransaction** - история всех операций с токенами

### Стоимость операций

```typescript
export const TOKEN_COSTS = {
  GENERATE_SLIDE: 50,    // Генерация слайда
  GENERATE_TEXT: 25,     // Генерация текста
  GENERATE_IMAGE: 100,   // Генерация изображения
  GENERATE_THEME: 75,    // Генерация темы
  CHAT_MESSAGE: 10,      // Сообщение в чате
} as const;
```

## Middleware для токенов

После рефакторинга все AI routes используют унифицированный middleware `withTokenDeduction`:

### Принципы работы middleware

1. **Серверная логика** - вся логика расчета токенов находится на сервере
2. **Безопасность** - фронтенд не может влиять на количество списываемых токенов
3. **Единообразие** - все AI операции используют одинаковый подход
4. **Надежность** - токены списываются только после успешного выполнения операции

### Пример использования

```typescript
export async function POST(request: NextRequest) {
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_SLIDE',
            description: 'Generate presentation slides',
            calculateTokens: TokenCalculators.generateSlides,
            metadata: MetadataExtractors.presentation,
        },
        async (session, requestData) => {
            // Бизнес-логика операции
            const result = await performAIOperation(requestData);
            return result;
        }
    );
}
```

### Серверные калькуляторы токенов

```typescript
export const TokenCalculators = {
    generateSlides: (requestData: any): number => {
        const { topics } = requestData;
        if (!topics || !Array.isArray(topics)) {
            throw new Error('Invalid topics data for token calculation');
        }
        return topics.length * TOKEN_COSTS.GENERATE_SLIDE;
    },
    generateSingleSlide: () => TOKEN_COSTS.GENERATE_SLIDE,
    generateText: () => TOKEN_COSTS.GENERATE_TEXT,
    improveContent: () => TOKEN_COSTS.GENERATE_TEXT,
    generateImage: () => TOKEN_COSTS.GENERATE_IMAGE,
    generateTheme: () => TOKEN_COSTS.GENERATE_THEME,
};
```

## API Endpoints

### Отрефакторенные AI routes

- `POST /api/ai/presentation` - генерация презентации (использует middleware)
- `POST /api/ai/slide` - генерация отдельного слайда (использует middleware)
- `POST /api/ai/topics` - генерация топиков презентации (использует middleware)
- `POST /api/ai/improve` - улучшение содержимого слайда (использует middleware)

### Токены пользователя

- `GET /api/tokens/balance` - получить баланс токенов
- `GET /api/tokens/transactions` - история транзакций

### Пакеты токенов

- `GET /api/tokens/packages` - доступные пакеты для покупки

## Преимущества после рефакторинга

1. **Безопасность** - логика токенов полностью на сервере
2. **DRY принцип** - отсутствие дублирования кода
3. **Консистентность** - единообразное поведение всех AI routes
4. **Простота поддержки** - изменения в логике токенов в одном месте
5. **Надежность** - автоматическое отслеживание использования токенов

## Мониторинг

Все операции с токенами автоматически записываются в `TokenTransaction` с метаданными:

- Тип операции
- Количество использованных токенов
- Описание операции
- Контекстные данные (ID презентации, слайда и т.д.)

## Обработка ошибок

Middleware автоматически обрабатывает:

- Неавторизованные запросы (401)
- Недостаток токенов (402)
- Некорректные данные (400)
- Внутренние ошибки (500)

## Использование

### Проверка токенов перед операцией

```typescript
import { hasEnoughTokens } from '@/utils/tokens';
import { getTokenCostForOperation } from '@/utils/getTokenCostForOperation';

const requiredTokens = getTokenCostForOperation('GENERATE_SLIDE');
const hasTokens = await hasEnoughTokens(userId, requiredTokens);

if (!hasTokens) {
  return NextResponse.json({
    error: 'Insufficient tokens',
    requiredTokens,
  }, { status: 402 });
}
```

### Списание токенов после операции

```typescript
import { useTokensForLLM } from '@/utils/tokens';

await useTokensForLLM({
  userId,
  amount: requiredTokens,
  description: 'Generated presentation slides',
  metadata: { presentationId, slidesCount },
});
```

### Использование хука на клиенте

```typescript
import { useTokens } from '@/hooks/useTokens';

const { balance, loading, packages, purchaseTokens } = useTokens();
```

## Компоненты

### TokenBalance

Компонент для отображения баланса токенов с CSS-модулями:

```typescript
<TokenBalance 
  balance={balance}
  loading={loading}
  variant="compact"
  onClick={() => navigate('/tokens')}
/>
```

### Страница токенов

Полная страница управления токенами доступна по адресу `/tokens`:

- Текущий баланс
- Доступные пакеты для покупки
- История транзакций

Использует CSS-модули и Chakra UI переменные для стилизации.

## Стилизация

Проект использует CSS-модули вместо Tailwind CSS:

- `src/app/(dashboard)/tokens/page.module.css` - стили страницы токенов
- `src/components/tokens/TokenBalance.module.css` - стили компонента баланса

Переменные Chakra UI доступны через CSS custom properties:
- `var(--chakra-colors-gray-900)`
- `var(--chakra-colors-blue-500)`
- `var(--chakra-radii-lg)`
- `var(--chakra-shadows-sm)`

## Инициализация

### Миграция базы данных

```bash
npx prisma db push
```

### Заполнение тестовыми данными

```bash
node scripts/seed-tokens.js
```

Скрипт создаст:
- 4 пакета токенов (Mini, Starter, Professional, Enterprise)
- 100 бесплатных токенов для существующих пользователей

## Интеграция с платежами

Система готова для интеграции с платежными провайдерами (Stripe, PayPal). 

В `useTokens` хуке есть заглушка для `purchaseTokens`, которую нужно заменить на реальную интеграцию:

```typescript
const purchaseTokens = useCallback(async (packageId: string) => {
  // Интеграция со Stripe/PayPal
  const session = await createPaymentSession(packageId);
  window.location.href = session.url;
}, []);
```

## Безопасность

- Проверка токенов происходит на сервере
- Транзакции выполняются атомарно
- История операций сохраняется для аудита 
# LLM Request Logging System

Система логирования запросов к LLM с поддержкой группировки по уникальному `requestId`.

## Основные возможности

- ✅ Уникальный `requestId` для группировки связанных запросов
- ✅ Логирование всех запросов к LLM (GigaChat, YandexGPT, MockGPT)
- ✅ Фильтрация по `requestId`, `userId`, и `provider`
- ✅ Детальный просмотр всех запросов в рамках одного `requestId`
- ✅ **Экспорт в формат MockGPT сценариев** 🆕
- ✅ Индексы для быстрого поиска

## Как это работает

### 1. Генерация requestId

При каждом пользовательском запросе (например, создание презентации из документа) генерируется уникальный `requestId`:

```typescript
import { generateRequestId } from '@/utils/requestId';

const requestId = generateRequestId(); // UUID v4
```

### 2. Передача requestId в LLM сервисы

Все вызовы LLM получают этот `requestId` в опциях:

```typescript
const response = await llmService.generate(prompt, {
    functions: [functionSchema],
    function_call: { name: 'generate_slide_text' },
    requestId, // Передаем requestId
});
```

### 3. Логирование

Каждый LLM сервис автоматически логирует запрос с `requestId`:

```typescript
await LLMHistoryService.logRequest({
    userId: this.userId,
    provider: 'gigachat',
    presentationId: options.presentationId,
    requestId: options.requestId, // Сохраняем requestId
    requestType: 'generate_content',
    prompt,
    // ... другие поля
});
```

## Просмотр логов

### Основная страница аналитики

`/tech-llm-analytics` - показывает все запросы с возможностью фильтрации:

- **Фильтры:**
  - Request ID - точный поиск по ID
  - User ID - фильтр по пользователю
  - Provider - фильтр по провайдеру LLM

- **Список недавних Request ID** - быстрый доступ к группам запросов

### Детальная страница запроса

`/tech-llm-analytics/[requestId]` - показывает все запросы для конкретного `requestId`:

- **Сводка:** количество запросов, временной диапазон, пользователь, процент успеха
- **Группировка по типам:** запросы сгруппированы по `requestType`
- **Детальная информация:** токены, время выполнения, статус
- **Raw данные:** полный JSON для отладки
- **🆕 Экспорт в MockGPT:** кнопка для экспорта всех запросов как тестовый сценарий

## 🆕 Экспорт в MockGPT сценарии

### Что это дает

- **Воспроизведение проблем:** Экспортируйте проблемные ответы и используйте их для тестирования
- **Регрессионное тестирование:** Сохраняйте рабочие сценарии для проверки изменений
- **Быстрое создание тестов:** Автоматическое создание MockGPT сценариев из реальных данных

### Как использовать

1. **Перейдите на детальную страницу запроса:** `/tech-llm-analytics/[requestId]`
2. **Нажмите кнопку "📤 Export as MockGPT Scenario"**
3. **Настройте экспорт:**
   - Введите название сценария
   - Добавьте описание
   - Выберите способ сохранения
4. **Экспортируйте:**
   - **Download JSON** - скачать файл для ручного размещения
   - **Save to Project** - сохранить прямо в папку `scenarios/`

### Что экспортируется

- ✅ Только успешные запросы с ответами
- ✅ Function calls и их аргументы
- ✅ Умные триггеры:
  - `function_name` - для вызовов функций
  - `template_id` - для определенных шаблонов (автоопределение)
  - `prompt_contains` - для остальных случаев
- ✅ Готовый к использованию формат MockGPT

### Пример экспортированного сценария

```json
{
  "name": "Document Processing Issue",
  "description": "Exported from 5 LLM requests on 2025-01-14",
  "responses": [
    {
      "id": "exported-response-1",
      "description": "Exported from gigachat - generate_content (2025-01-14T10:30:00.000Z)",
      "trigger": {
        "type": "function_name",
        "value": "generate_slide_text"
      },
      "response": {
        "elements": [],
        "function_call": {
          "name": "generate_slide_text",
          "arguments": {
            "title": "**Проблемный заголовок без закрытия",
            "content": "Контент с проблемами форматирования"
          }
        }
      }
    }
  ]
}
```

### Использование экспортированного сценария

```bash
# 1. Поместить файл в папку scenarios/
cp exported-scenario.json src/services/llm/mockGpt/scenarios/

# 2. Активировать сценарий
node scripts/test-scenarios.js set exported-scenario

# 3. Создать презентацию - будут использованы экспортированные ответы
```

## API для работы с логами

### LLMHistoryService методы

```typescript
// Получить все запросы с фильтрацией
const history = await LLMHistoryService.getAllHistory({
    limit: 50,
    requestId: 'uuid-here',
    userId: 'user-id',
    provider: 'gigachat'
});

// Получить все запросы для конкретного requestId
const requests = await LLMHistoryService.getRequestsByRequestId(requestId);

// Получить список уникальных requestId
const requestIds = await LLMHistoryService.getRequestIds({ limit: 50 });
```

### 🆕 API экспорта

```typescript
// GET /api/tech-llm-analytics/[requestId]/export
// Скачать сценарий как JSON файл
fetch(`/api/tech-llm-analytics/${requestId}/export?name=MyScenario&description=Test`)

// POST /api/tech-llm-analytics/[requestId]/export
// Создать или сохранить сценарий
fetch(`/api/tech-llm-analytics/${requestId}/export`, {
    method: 'POST',
    body: JSON.stringify({
        name: 'My Scenario',
        description: 'Description',
        saveToFile: true // Сохранить в проект
    })
});
```

## Использование в коде

### Создание нового requestId

```typescript
import { generateRequestId } from '@/utils/requestId';

// Полный UUID
const requestId = generateRequestId();

// Короткий ID для отображения (первые 8 символов)
const shortId = generateShortRequestId();

// Валидация
if (isValidRequestId(requestId)) {
    // ID валиден
}
```

### Передача в LLM сервисы

```typescript
const llmService = createLLMService({ userId });

// Все методы поддерживают requestId
await llmService.generate(prompt, { requestId });
await llmService.generateImage(prompt, { userId, requestId });
```

## Примеры использования

### 1. Создание презентации из документа

```typescript
async function createPresentationFromDocument(documentText: string, userId: string) {
    const requestId = generateRequestId();
    
    // Генерируем топики
    const topics = await generateTopicsWithContent(userId, {
        content: documentText,
        numSlides: 5
    }, requestId);
    
    // Генерируем слайды
    for (const topic of topics) {
        await generateSlide({
            topic: topic.title,
            options: { userId, requestId }
        });
    }
    
    // Все запросы будут связаны одним requestId
}
```

### 2. Отладка проблемы

1. Найти проблемный запрос на `/tech-llm-analytics`
2. Кликнуть на Request ID для просмотра деталей
3. Увидеть все связанные запросы и их результаты
4. **🆕 Экспортировать как сценарий** для воспроизведения проблемы
5. Использовать Raw данные для глубокой отладки

### 3. Мониторинг производительности

```typescript
// Получить статистику по requestId
const requests = await LLMHistoryService.getRequestsByRequestId(requestId);
const totalTokens = requests.reduce((sum, req) => sum + req.totalTokens, 0);
const totalDuration = requests.reduce((sum, req) => sum + req.duration, 0);
const successRate = requests.filter(r => r.success).length / requests.length;
```

### 4. 🆕 Автоматизация тестирования

```typescript
// Экспорт проблемного сценария программно
import { exportToMockGPTScenario } from '@/utils/exportScenario';

const requests = await LLMHistoryService.getRequestsByRequestId(requestId);
const scenario = exportToMockGPTScenario(
    requests, 
    'Formatting Issues Test',
    'Reproduces text formatting problems'
);

// Сохранить или использовать сценарий
fs.writeFileSync('scenarios/formatting-issues.json', JSON.stringify(scenario, null, 2));
```

## База данных

### Схема LLMRequestHistory

```prisma
model LLMRequestHistory {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  requestId      String?  // Уникальный ID запроса для группировки
  userId         String?  @db.ObjectId
  provider       String   // 'gigachat' | 'yagpt' | 'mock'
  requestType    String   // 'generate_content' | 'generate_image'
  timestamp      DateTime @default(now())
  
  // ... другие поля
  
  @@index([requestId])
  @@index([userId])
  @@index([timestamp])
}
```

### Индексы для производительности

- `requestId` - быстрый поиск связанных запросов
- `userId` - фильтрация по пользователям
- `timestamp` - сортировка по времени

## Миграция

Для существующих записей без `requestId`:

```bash
# Применить миграцию
npm run prisma:migrate
```

Старые записи останутся с `requestId: null`, новые будут иметь UUID. 
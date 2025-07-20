# MockGPT Testing System

Система для тестирования проблем с форматированием текста в слайдах путем подстановки предопределенных ответов от LLM.

## Быстрый старт

### 1. Переключение на Mock провайдер

Установите переменную окружения:
```bash
export LLM_PROVIDER=mock
```

Или в `.env.local`:
```
LLM_PROVIDER=mock
```

### 2. Использование тестового сценария

Установите переменную окружения с названием сценария:
```bash
export MOCK_TEST_SCENARIO=formatting-issues
```

Или в `.env.local`:
```
MOCK_TEST_SCENARIO=formatting-issues
```

### 3. Создание презентации

Теперь при создании презентации из документа будут использоваться предопределенные ответы из сценария.

## Доступные сценарии

### `formatting-issues`
Тестирует различные проблемы с форматированием:
- Незакрытые markdown теги
- Вложенное форматирование
- Смешивание HTML и Markdown
- Специальные символы
- Длинный неформатированный текст

### `template-specific-tests`
Тестирует конкретные шаблоны слайдов:
- Welcome slide
- Two-column layout
- Smart layout with cards
- Chart slides
- Final slide with contacts

## Создание собственного сценария

### Структура файла сценария

```json
{
  "name": "Название сценария",
  "description": "Описание что тестирует сценарий",
  "responses": [
    {
      "id": "уникальный-идентификатор",
      "description": "Описание этого ответа",
      "trigger": {
        "type": "prompt_contains | function_name | template_id",
        "value": "строка для поиска или точное значение"
      },
      "response": {
        "elements": [],
        "function_call": {
          "name": "generate_slide_text",
          "arguments": {
            "title": "Заголовок слайда",
            "content": "Содержимое с **форматированием**"
          }
        }
      }
    }
  ]
}
```

### Типы триггеров

1. **`prompt_contains`** - срабатывает, если промпт содержит указанную строку
2. **`function_name`** - срабатывает для конкретного вызова функции
3. **`template_id`** - срабатывает, если промпт содержит ID шаблона

### Создание сценария из логов

Если у вас есть проблемные ответы в логах, можно создать сценарий программно:

```typescript
import { createScenarioFromLogs } from '@/services/llm/mockGpt/testUtils';

const logEntries = [
  {
    prompt: "Создай слайд с заголовком...",
    response: {
      elements: [],
      function_call: {
        name: "generate_slide_text",
        arguments: {
          title: "**Проблемный заголовок без закрытия"
        }
      }
    },
    functionCall: "generate_slide_text"
  }
];

const scenarioContent = createScenarioFromLogs(
  "Проблемы из логов",
  "Сценарий созданный из реальных проблемных ответов",
  logEntries
);

// Сохранить в файл scenarios/проблемы-из-логов.json
```

## API для управления сценариями

### GET /api/test/scenarios
Получить список всех доступных сценариев:

```bash
curl -X GET http://localhost:3000/api/test/scenarios
```

### POST /api/test/scenarios
Создать или валидировать сценарий:

```bash
# Валидация существующего сценария
curl -X POST http://localhost:3000/api/test/scenarios \
  -H "Content-Type: application/json" \
  -d '{"action": "validate", "scenarioName": "formatting-issues"}'

# Создание нового сценария
curl -X POST http://localhost:3000/api/test/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "scenarioName": "my-test-scenario",
    "scenarioData": {
      "name": "My Test",
      "description": "Test description",
      "responses": [...]
    }
  }'

# Создание сценария из логов
curl -X POST http://localhost:3000/api/test/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createFromLogs",
    "name": "From Logs Test",
    "description": "Created from logs",
    "logEntries": [...]
  }'
```

## Программное использование

### В коде приложения

```typescript
import { createLLMService } from '@/services/llm';

// Использование с конкретным сценарием
const llmService = createLLMService({ 
  userId: 'user123',
  provider: 'mock',
  testScenario: 'formatting-issues'
});

// Использование с переменной окружения
process.env.LLM_PROVIDER = 'mock';
process.env.MOCK_TEST_SCENARIO = 'template-specific-tests';
const llmService2 = createLLMService({ userId: 'user123' });
```

### Утилиты для тестирования

```typescript
import { 
  getAvailableScenarios, 
  validateScenario,
  setTestEnvironment 
} from '@/services/llm/mockGpt/testUtils';

// Получить все доступные сценарии
const scenarios = getAvailableScenarios();

// Валидировать сценарий
const validation = validateScenario('formatting-issues');
if (!validation.valid) {
  console.log('Errors:', validation.errors);
}

// Быстрая настройка тестового окружения
setTestEnvironment('formatting-issues');
```

## Отладка

### Логи MockGPT

MockGPT выводит информацию о используемых ответах в консоль:

```
[MockGPT] Loaded test scenario: Formatting Issues Test
[MockGPT] Using test response: broken-markdown-response - Response with broken markdown formatting
```

### Проверка в базе данных

Все запросы к MockGPT логируются в базу данных с метаданными о сценарии:

```sql
SELECT * FROM llm_history 
WHERE provider = 'mock' 
AND metadata->>'scenario' = 'Formatting Issues Test';
```

## Лучшие практики

1. **Создавайте специфичные сценарии** для каждого типа проблем
2. **Используйте описательные ID** для ответов
3. **Тестируйте различные триггеры** для надежности
4. **Валидируйте сценарии** перед использованием
5. **Документируйте проблемы** в описаниях ответов

## Решение проблем

### Сценарий не загружается
- Проверьте синтаксис JSON файла
- Убедитесь, что файл находится в правильной директории
- Проверьте права доступа к файлу

### Ответы не срабатывают
- Проверьте типы триггеров и их значения
- Убедитесь, что промпты содержат ожидаемые строки
- Проверьте логи MockGPT в консоли

### Ошибки форматирования не воспроизводятся
- Убедитесь, что используете правильный провайдер (mock)
- Проверьте структуру ответов в сценарии
- Сравните с реальными проблемными ответами из логов 
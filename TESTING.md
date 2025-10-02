# Тестирование проблем с форматированием

Система для воспроизведения и тестирования проблем с форматированием текста в слайдах.

## Быстрый старт

### 1. Просмотр доступных сценариев

```bash
node scripts/test-scenarios.js list
```

### 2. Активация тестового сценария

```bash
# Для тестирования проблем с форматированием
node scripts/test-scenarios.js set formatting-issues

# Для тестирования конкретных шаблонов
node scripts/test-scenarios.js set template-specific-tests
```

### 3. Создание презентации

После активации сценария создавайте презентации как обычно - будут использоваться предопределенные ответы с проблемами форматирования.

### 4. Отключение тестового режима

```bash
node scripts/test-scenarios.js disable
```

## Создание сценария из проблемных логов

Если у вас есть проблемные ответы в логах:

1. Скопируйте проблемный ответ из логов
2. Создайте новый JSON файл в `src/services/llm/mockGpt/scenarios/`
3. Используйте структуру из существующих сценариев

Пример:
```json
{
  "name": "Мой тестовый сценарий",
  "description": "Описание проблемы",
  "responses": [
    {
      "id": "problematic-response",
      "description": "Ответ с проблемой форматирования",
      "trigger": {
        "type": "function_name",
        "value": "generate_slide_text"
      },
      "response": {
        "elements": [],
        "function_call": {
          "name": "generate_slide_text",
          "arguments": {
            "title": "**Заголовок без закрывающего тега",
            "content": "Проблемный контент..."
          }
        }
      }
    }
  ]
}
```

## API для управления сценариями

```bash
# Получить список сценариев
curl -X GET http://localhost:3000/api/test/scenarios

# Валидировать сценарий
curl -X POST http://localhost:3000/api/test/scenarios \
  -H "Content-Type: application/json" \
  -d '{"action": "validate", "scenarioName": "formatting-issues"}'
```

## Отладка

### Проверка активного сценария

Проверьте файл `.env.local`:
```
LLM_PROVIDER=mock
MOCK_TEST_SCENARIO=formatting-issues
```

### Логи MockGPT

В консоли разработки вы увидите:
```
[MockGPT] Loaded test scenario: Formatting Issues Test
[MockGPT] Using test response: broken-markdown-response - Response with broken markdown formatting
```

## Подробная документация

Полная документация находится в `src/services/llm/mockGpt/README.md` 
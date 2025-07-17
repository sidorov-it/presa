# Настройка пути загрузки файлов (UPLOAD_PATH)

## Описание

Переменная окружения `UPLOAD_PATH` позволяет настроить кастомный путь для загрузки файлов в приложении.

## Использование

### Локальная разработка

Добавьте в файл `.env`:

```env
UPLOAD_PATH=/custom/path/to/uploads
```

### Продакшн (GitHub Actions)

Добавьте секрет `UPLOAD_PATH` в настройках репозитория GitHub:

1. Перейдите в Settings → Secrets and variables → Actions
2. Нажмите "New repository secret"
3. Имя: `UPLOAD_PATH`
4. Значение: `/var/www/slydle/uploads` (или другой желаемый путь)

## Поведение

- **Если переменная установлена**: используется указанный путь
- **Если переменная не установлена**: используется стандартный путь `public/uploads`

## Примеры путей

```env
# Абсолютный путь
UPLOAD_PATH=/var/www/slydle/uploads

# Относительный путь (относительно process.cwd())
UPLOAD_PATH=./custom-uploads

# Путь с переменными окружения
UPLOAD_PATH=$HOME/app-uploads
```

## Файлы, использующие UPLOAD_PATH

- `src/app/api/assets/upload/route.ts` - Загрузка файлов
- `src/app/api/assets/upload-external/route.ts` - Загрузка внешних изображений
- `src/app/api/assets/[filename]/route.ts` - Получение файлов
- `src/app/api/test/route.ts` - Тестовый API
- `src/services/llm/gigaChat/gigaChat.ts` - Генерация изображений GigaChat
- `src/services/llm/yaGpt/yaGpt.ts` - Генерация изображений Yandex GPT
- `src/themes/parseGammaThemes.ts` - Парсинг тем

## Утилита

Путь получается через утилиту `src/utils/uploadPath.ts`:

```typescript
import { getUploadPath } from '@/utils/uploadPath';

const uploadDir = getUploadPath();
```

## Важные замечания

1. Убедитесь, что указанная директория существует и имеет права на запись
2. В продакшне путь должен быть доступен для веб-сервера
3. При изменении пути существующие файлы не будут автоматически перемещены 
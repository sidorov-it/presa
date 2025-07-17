# Изменения для поддержки UPLOAD_PATH

## Созданные файлы

1. **`src/utils/uploadPath.ts`** - Утилита для получения пути загрузки
2. **`UPLOAD_PATH_SETUP.md`** - Документация по настройке
3. **`UPLOAD_PATH_CHANGES.md`** - Этот файл с резюме изменений

## Обновленные файлы (8 файлов)

### API маршруты
1. **`src/app/api/assets/upload/route.ts`**
   - Добавлен импорт `getUploadPath`
   - Заменен `path.join(process.cwd(), 'public', 'uploads')` на `getUploadPath()`

2. **`src/app/api/assets/upload-external/route.ts`**
   - Добавлен импорт `getUploadPath`
   - Заменен `path.join(process.cwd(), 'public', 'uploads')` на `getUploadPath()`

3. **`src/app/api/assets/[filename]/route.ts`**
   - Добавлен импорт `getUploadPath`
   - Заменен `path.join(process.cwd(), 'public', 'uploads')` на `getUploadPath()`

4. **`src/app/api/test/route.ts`**
   - Добавлен импорт `getUploadPath`
   - Заменен `path.join(process.cwd(), 'public', 'uploads')` на `getUploadPath()`

### Сервисы LLM
5. **`src/services/llm/gigaChat/gigaChat.ts`**
   - Добавлен динамический импорт `getUploadPath` в двух местах
   - Заменены вызовы `path.join(process.cwd(), 'public', 'uploads')` на `getUploadPath()`

6. **`src/services/llm/yaGpt/yaGpt.ts`**
   - Добавлен динамический импорт `getUploadPath`
   - Заменен вызов `path.join(process.cwd(), 'public', 'uploads')` на `getUploadPath()`

### Утилиты
7. **`src/themes/parseGammaThemes.ts`**
   - Добавлен импорт `getUploadPath`
   - Заменен `path.join(process.cwd(), 'public', 'uploads')` на `getUploadPath()`

### Деплой
8. **`.github/workflows/deploy.yml`**
   - Добавлена переменная `UPLOAD_PATH="${{ secrets.UPLOAD_PATH }}"` в создание .env файла

## Логика работы

- Если переменная `UPLOAD_PATH` установлена в `.env` - используется её значение
- Если переменная не установлена - используется стандартный путь `public/uploads`
- В продакшне переменная берется из GitHub Secrets

## Следующие шаги

1. Добавить секрет `UPLOAD_PATH` в GitHub репозиторий
2. Протестировать локально с переменной в `.env`
3. Убедиться, что указанная директория существует и доступна для записи 
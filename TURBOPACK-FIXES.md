# Turbopack Runtime Issues - Fixes

## Проблема
Периодически возникает ошибка: `Error: Cannot find module '../chunks/ssr/[turbopack]_runtime.js'`

## Причины
1. Конфликт между Turbopack и сложными Webpack конфигурациями
2. Нестабильность кеша Turbopack при агрессивных оптимизациях
3. Проблемы с chunk splitting в dev режиме

## Решения

### 1. Упрощение next.config.js ✅
- Убраны агрессивные оптимизации для dev режима
- Chunk splitting применяется только для production
- Удалены конфликтующие с Turbopack настройки кеширования

### 2. Очистка кешей ✅
```bash
rm -rf .next
rm -rf node_modules/.cache  
npm cache clean --force
npm install
```

### 3. Команды запуска
```bash
# С Turbopack (по умолчанию)
npm run dev

# Быстрый режим с Turbopack
npm run dev:fast

# Стабильный режим без Turbopack (если проблемы продолжаются)
npm run dev:stable
```

### 4. Переменные окружения (добавить в .env.local)
```
TURBOPACK_DEV_MEMORY_LIMIT=8192
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=8192
NEXT_DEBUG_BUILD=false
```

### 5. Если проблема повторяется
1. Переключиться на `npm run dev:stable` (без Turbopack)
2. Очистить кеши: `rm -rf .next && npm run dev`
3. Проверить версию Next.js (возможно нужно обновить)

## Мониторинг
- Следить за логами в консоли при переходах между страницами
- При появлении ошибки сразу очистить кеши
- В production билде проблема не возникает (только в dev режиме)

## Обновления
- Регулярно обновлять Next.js для получения исправлений Turbopack
- Следить за changelog Next.js для решения известных проблем с Turbopack 
# Решение проблем с памятью при сборке Next.js

## Проблемы при сборке

### 1. Нехватка памяти
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

### 2. Ошибка self is not defined
```
unhandledRejection ReferenceError: self is not defined
```

## Решения

### 1. ✅ Основные исправления (уже реализованы)

#### Увеличение лимита памяти Node.js
- **GitHub Actions**: `NODE_OPTIONS: '--max-old-space-size=4096'`
- **package.json**: `"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"`

#### Оптимизация конфигурации Next.js
- ✅ Отключены source maps для production
- ✅ Добавлено логирование только ошибок
- ✅ Оптимизированы webpack настройки
- ✅ Исправлена ошибка "self is not defined"
- ✅ Добавлены fallback'и для Node.js модулей

#### Кэширование
- ✅ Кэш npm пакетов
- ✅ Кэш Next.js сборки

### 2. 🔧 Дополнительные решения

#### Если проблема продолжается:

**Вариант A: Увеличить память до 6GB**
```yaml
- name: Build application
  run: npm run build
  env:
    NODE_OPTIONS: '--max-old-space-size=6144'
```

**Вариант B: Отключить минификацию (временно)**
```js
// next.config.js
const nextConfig = {
  swcMinify: false, // Отключить минификацию
  compiler: {
    removeConsole: false, // Не удалять console.log
  }
}
```

**Вариант C: Использовать build на сервере**
Перенести сборку на сервер с большим количеством памяти:

```yaml
- name: Deploy and build on server
  run: |
    ssh ${{ secrets.USERNAME }}@${{ secrets.HOST }} "
      cd /var/www/slydle/current
      export NODE_OPTIONS='--max-old-space-size=8192'
      npm run build
    "
```

### 3. 🚀 Self-hosted Runner (рекомендуется)

Для стабильной сборки больших приложений:

1. **Настройка self-hosted runner на сервере:**
```bash
# На сервере
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Настройка (используйте токен из GitHub Settings > Actions > Runners)
./config.sh --url https://github.com/your-username/slydle --token YOUR_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

2. **Использование alternative workflow:**
   - Файл `.github/workflows/deploy-large-build.yml` готов
   - Запускается вручную через GitHub Actions

### 4. 📊 Мониторинг использования памяти

**Локальная проверка:**
```bash
# Проверка размера сборки
npm run build -- --profile
```

**В GitHub Actions:**
```yaml
- name: Memory usage before build
  run: free -h

- name: Build with memory monitoring
  run: |
    export NODE_OPTIONS='--max-old-space-size=4096'
    npm run build
```

### 5. 🎯 Профилирование и оптимизация

**Анализ bundle size:**
```bash
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

**Оптимизация зависимостей:**
- Используйте динамические импорты для больших библиотек
- Рассмотрите замену тяжелых библиотек на более легкие аналоги
- Проверьте дублирующиеся зависимости

### 6. 🔄 План действий при ошибке

1. **Первая попытка**: Увеличить `max-old-space-size` до 6144
2. **Вторая попытка**: Использовать alternative workflow (self-hosted)
3. **Третья попытка**: Собирать на сервере
4. **Долгосрочно**: Настроить self-hosted runner

### 7. 🔧 Решение ошибки "self is not defined"

**Если возникает ошибка:**
```
unhandledRejection ReferenceError: self is not defined
```

**Решение (уже реализовано в next.config.js):**
```js
// В webpack конфигурации
if (isServer) {
  config.plugins.push(
    new webpack.DefinePlugin({
      self: 'undefined',
      window: 'undefined',
      document: 'undefined',
    })
  );
}
```

**Альтернативное решение для конкретных библиотек:**
```js
// Динамический импорт для браузерных библиотек
const domToImage = dynamic(() => import('dom-to-image'), { ssr: false });
```

### 8. ⚡ Быстрые команды для отладки

```bash
# Локальная сборка с увеличенной памятью
NODE_OPTIONS='--max-old-space-size=8192' npm run build

# Проверка размера node_modules
du -sh node_modules/

# Анализ наиболее тяжелых пакетов
npx cost-of-modules

# Очистка кэшей
npm cache clean --force
rm -rf .next/
rm -rf node_modules/
npm install
```

## Текущий статус

✅ **Реализовано:**
- Увеличен лимит памяти до 4GB
- Добавлено кэширование
- Оптимизирована конфигурация Next.js
- Исправлена ошибка "self is not defined"
- Добавлены webpack fallback'и для серверной среды
- Создан alternative workflow для больших сборок

📋 **Следующие шаги:**
1. Попробовать деплой с текущими настройками
2. При необходимости - увеличить память до 6GB
3. Настроить self-hosted runner для стабильности 
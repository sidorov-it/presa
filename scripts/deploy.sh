#!/bin/bash

# Check if required environment variables are provided
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
  echo "Usage: $0 <DATABASE_URL> <NEXTAUTH_SECRET> <NEXTAUTH_URL>"
  exit 1
fi

# Store environment variables from arguments
export DATABASE_URL="$1"
export NEXTAUTH_SECRET="$2"
export NEXTAUTH_URL="$3"

# Создаем директории
mkdir -p /var/www/slydle
cd /var/www/slydle

# Создаем бэкап текущей версии
if [ -d "current" ]; then
  mv current backup-$(date +%Y%m%d-%H%M%S)
fi

# Очищаем старые бэкапы (оставляем только 3 последних) и их node_modules
ls -dt backup-* | tail -n +4 | xargs -r rm -rf
ls -dt backup-* | head -n -1 | xargs -r -I {} rm -rf {}/node_modules 2>/dev/null || true

# Распаковываем новую версию
tar -xzf deploy-package.tar.gz
mv deploy-package current
rm deploy-package.tar.gz

# Копируем node_modules из последнего backup если он существует
LATEST_BACKUP=$(ls -dt backup-* | head -1 2>/dev/null || echo "")
if [ -n "$LATEST_BACKUP" ] && [ -d "$LATEST_BACKUP/node_modules" ]; then
  echo "Копируем node_modules из $LATEST_BACKUP..."
  cp -r "$LATEST_BACKUP/node_modules" . || echo "Ошибка копирования, будет полная установка"
fi

cd current

# Создаем .env файл с экранированием специальных символов
cat > .env << 'EOF'
DATABASE_URL='${DATABASE_URL}'
NEXTAUTH_SECRET='${NEXTAUTH_SECRET}'
NEXTAUTH_URL='${NEXTAUTH_URL}'
NODE_ENV=production
PORT=3000
EOF

# Заменяем плейсхолдеры реальными значениями
sed -i "s|\${DATABASE_URL}|$DATABASE_URL|" .env
sed -i "s|\${NEXTAUTH_SECRET}|$NEXTAUTH_SECRET|" .env
sed -i "s|\${NEXTAUTH_URL}|$NEXTAUTH_URL|" .env

echo "=== Проверка содержимого .env файла ==="
echo "DATABASE_URL присутствует: $(grep -q DATABASE_URL .env && echo 'да' || echo 'нет')"
echo "NEXTAUTH_SECRET присутствует: $(grep -q NEXTAUTH_SECRET .env && echo 'да' || echo 'нет')"
echo "NEXTAUTH_URL присутствует: $(grep -q NEXTAUTH_URL .env && echo 'да' || echo 'нет')"

# Создаем директорию для логов
mkdir -p /var/www/slydle/logs

# Копируем ecosystem.config.js в корень проекта (только если его нет)
if [ ! -f "/var/www/slydle/ecosystem.config.js" ]; then
  cp ecosystem.config.js /var/www/slydle/
fi

# Проверяем, нужно ли переустанавливать зависимости
NEED_INSTALL=false
if [ ! -d "node_modules" ]; then
  echo "node_modules не найден - нужна установка"
  NEED_INSTALL=true
elif [ ! -f "/var/www/slydle/package.json.hash" ] || [ ! -f "/var/www/slydle/package-lock.json.hash" ]; then
  echo "Хеши файлов не найдены - нужна установка"
  NEED_INSTALL=true
else
  # Сравниваем хеши файлов зависимостей
  CURRENT_PACKAGE_HASH=$(md5sum package.json | cut -d" " -f1)
  CURRENT_LOCK_HASH=$(md5sum package-lock.json | cut -d" " -f1)
  SAVED_PACKAGE_HASH=$(cat /var/www/slydle/package.json.hash 2>/dev/null || echo "")
  SAVED_LOCK_HASH=$(cat /var/www/slydle/package-lock.json.hash 2>/dev/null || echo "")
  
  if [ "$CURRENT_PACKAGE_HASH" != "$SAVED_PACKAGE_HASH" ] || [ "$CURRENT_LOCK_HASH" != "$SAVED_LOCK_HASH" ]; then
    echo "Файлы зависимостей изменились - нужна переустановка"
    echo "package.json: $SAVED_PACKAGE_HASH -> $CURRENT_PACKAGE_HASH"
    echo "package-lock.json: $SAVED_LOCK_HASH -> $CURRENT_LOCK_HASH"
    NEED_INSTALL=true
  else
    echo "Зависимости не изменились - пропускаем установку"
    NEED_INSTALL=false
  fi
fi

# Устанавливаем зависимости только если нужно
if [ "$NEED_INSTALL" = true ]; then
  echo "=== Установка зависимостей ==="
  
  # Останавливаем PM2 процессы для освобождения памяти
  pm2 stop all || true
  
  # Очищаем npm кэш для экономии места
  npm cache clean --force || true
  
  # Устанавливаем зависимости с ограничениями памяти и таймаутом
  timeout 600 bash -c "NODE_OPTIONS=\"--max-old-space-size=512\" npm ci --only=production --prefer-offline --no-audit --no-fund --loglevel=error" || {
    echo "Установка зависимостей не удалась за 10 минут или была прервана"
    echo "Пробуем установить только основные зависимости..."
    NODE_OPTIONS="--max-old-space-size=256" npm install --only=production --no-optional --no-audit --no-fund
  }
  
  # Сохраняем хеши файлов зависимостей для следующего деплоя
  md5sum package.json | cut -d" " -f1 > /var/www/slydle/package.json.hash
  md5sum package-lock.json | cut -d" " -f1 > /var/www/slydle/package-lock.json.hash
  
  echo "=== Зависимости установлены и хеши сохранены ==="
else
  echo "=== Пропуск установки зависимостей ==="
fi

# Проверяем, нужно ли генерировать Prisma клиент
NEED_PRISMA_GENERATE=false
if [ ! -d "node_modules/.prisma" ]; then
  NEED_PRISMA_GENERATE=true
elif [ ! -f "/var/www/slydle/prisma.schema.hash" ]; then
  NEED_PRISMA_GENERATE=true
else
  CURRENT_SCHEMA_HASH=$(find prisma -name "*.prisma" -exec md5sum {} \; | md5sum | cut -d" " -f1)
  SAVED_SCHEMA_HASH=$(cat /var/www/slydle/prisma.schema.hash 2>/dev/null || echo "")
  
  if [ "$CURRENT_SCHEMA_HASH" != "$SAVED_SCHEMA_HASH" ]; then
    echo "Prisma схема изменилась - нужна генерация"
    NEED_PRISMA_GENERATE=true
  else
    echo "Prisma схема не изменилась - пропускаем генерацию"
    NEED_PRISMA_GENERATE=false
  fi
fi

if [ "$NEED_PRISMA_GENERATE" = true ]; then
  echo "=== Генерация Prisma клиента ==="
  NODE_OPTIONS="--max-old-space-size=256" npx prisma generate
  # Сохраняем хеш схемы
  find prisma -name "*.prisma" -exec md5sum {} \; | md5sum | cut -d" " -f1 > /var/www/slydle/prisma.schema.hash
else
  echo "=== Пропуск генерации Prisma клиента ==="
fi

# Запускаем миграции базы данных (только если была генерация Prisma)
if [ "$NEED_PRISMA_GENERATE" = true ]; then
  echo "=== Применение миграций базы данных ==="
  npx prisma db push
else
  echo "=== Пропуск миграций (схема не изменилась) ==="
fi

# Устанавливаем правильные права доступа
chown -R deploy:deploy /var/www/slydle
chmod -R 755 /var/www/slydle

# Перезапускаем приложение через PM2 с ecosystem.config.js
cd /var/www/slydle

# Пробуем перезапустить, если процесс уже существует
if pm2 describe slydle > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
  # Ждем завершения reload
  sleep 3
else
  pm2 start ecosystem.config.js
  # Ждем первого запуска
  sleep 5
fi

# Проверяем статус
pm2 status slydle

# Сохраняем конфигурацию PM2
pm2 save 
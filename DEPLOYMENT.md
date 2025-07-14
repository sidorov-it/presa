# Руководство по деплою slydle

## Обзор архитектуры

Приложение развертывается на Debian сервере с использованием:
- **Next.js** - основное приложение
- **PM2** - управление процессами
- **Nginx** - reverse proxy и статические файлы
- **MongoDB** - база данных (локально или облачно)
- **GitHub Actions** - CI/CD pipeline

## 🚀 Пошаговая настройка

### 1. Подготовка сервера

#### 1.1 Первичная настройка
```bash
# Запустите скрипт настройки на сервере
sudo bash scripts/server-setup.sh
```

#### 1.2 Настройка SSH ключей
```bash
# На сервере создайте SSH ключи для GitHub Actions
sudo -u deploy ssh-keygen -t rsa -b 4096 -C "github-actions@slydle.ru"

# Добавьте публичный ключ в ~/.ssh/authorized_keys
sudo -u deploy cat /home/deploy/.ssh/id_rsa.pub >> /var/www/.ssh/authorized_keys
sudo -u deploy chmod 600 /var/www/.ssh/authorized_keys

# Скопируйте приватный ключ для GitHub Secrets
sudo -u deploy cat /var/www/.ssh/id_rsa
```

### 2. Настройка домена и SSL

#### 2.1 DNS записи
Добавьте A-запись для вашего домена:
```
A  @  ваш-ip-адрес
A  www  ваш-ip-адрес
```

#### 2.2 SSL сертификат
```bash
# Получите SSL сертификат от Let's Encrypt
sudo certbot --nginx -d slydle.ru -d www.slydle.ru

# Проверьте автообновление
sudo certbot renew --dry-run
```

### 3. Настройка базы данных

#### 3.1 Локальная MongoDB (если нужна)
```bash
# Подключитесь к MongoDB
mongosh

# Создайте базу данных и пользователя
use slydle
db.createUser({
  user: "slydle_user",
  pwd: "enexub532",
  roles: [{role: "readWrite", db: "slydle"}]
})
```

#### 3.2 Строка подключения
```bash
# Локальная MongoDB
DATABASE_URL="mongodb://slydle_user:пароль@localhost:27017/slydle"

# MongoDB Atlas (облачная)
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/slydle"
```

### 4. Настройка GitHub

#### 4.1 GitHub Secrets
Добавьте следующие secrets в настройках репозитория (`Settings > Secrets and variables > Actions`):

| Secret | Описание | Пример |
|--------|----------|---------|
| `HOST` | IP адрес сервера | `192.168.1.100` |
| `USERNAME` | Пользователь для SSH | `deploy` |
| `PRIVATE_KEY` | Приватный SSH ключ | Содержимое `id_rsa` |
| `PORT` | SSH порт | `22` |
| `DATABASE_URL` | Строка подключения к БД | `mongodb://...` |
| `NEXTAUTH_SECRET` | Секрет для NextAuth | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL приложения | `https://ваш-домен.com` |

#### 4.2 Генерация NEXTAUTH_SECRET
```bash
# Генерируйте секретный ключ
openssl rand -base64 32
```

### 5. Первый деплой

#### 5.1 Подготовка репозитория
```bash
# Убедитесь, что все изменения закоммичены
git add .
git commit -m "Setup deployment configuration"
git push origin main
```

#### 5.2 Запуск деплоя
GitHub Action запустится автоматически при push в `main` ветку.

Или запустите вручную:
1. Перейдите в `Actions` на GitHub
2. Выберите `Deploy to Production`
3. Нажмите `Run workflow`

### 6. Проверка работы

#### 6.1 Статус приложения
```bash
# На сервере проверьте статус PM2
sudo -u deploy pm2 status

# Проверьте логи
sudo -u deploy pm2 logs slydle

# Проверьте статус Nginx
sudo systemctl status nginx
```

#### 6.2 Health check
```bash
# Проверьте health endpoint
curl https://ваш-домен.com/api/health
```

## 🔧 Управление приложением

### PM2 команды
```bash
# Перезапуск приложения
sudo -u deploy pm2 restart slydle

# Остановка приложения
sudo -u deploy pm2 stop slydle

# Просмотр логов в реальном времени
sudo -u deploy pm2 logs slydle --lines 100

# Мониторинг ресурсов
sudo -u deploy pm2 monit
```

### Nginx команды
```bash
# Перезапуск Nginx
sudo systemctl restart nginx

# Проверка конфигурации
sudo nginx -t

# Просмотр логов
sudo tail -f /var/log/nginx/slydle_access.log
sudo tail -f /var/log/nginx/slydle_error.log
```

## 🐛 Решение проблем

### Типичные проблемы

#### 1. Ошибка подключения к базе данных
```bash
# Проверьте статус MongoDB
sudo systemctl status mongod

# Проверьте строку подключения в логах
sudo -u deploy pm2 logs slydle | grep -i database
```

#### 2. Ошибки SSL
```bash
# Обновите сертификаты
sudo certbot renew

# Проверьте конфигурацию Nginx
sudo nginx -t
```

#### 3. Проблемы с правами доступа
```bash
# Исправьте права на файлы
sudo chown -R deploy:deploy /var/www/slydle
sudo chmod -R 755 /var/www/slydle
```

#### 4. Нехватка памяти
```bash
# Проверьте использование памяти
free -h
sudo -u deploy pm2 monit

# Настройте swap (если нужен)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Логи для диагностики
```bash
# Логи приложения
sudo -u deploy pm2 logs slydle

# Логи Nginx
sudo tail -f /var/log/nginx/slydle_error.log

# Системные логи
sudo journalctl -u nginx -f
sudo journalctl -u mongod -f
```

## 🔄 Обновление приложения

### Автоматическое обновление
Приложение обновляется автоматически при push в `main` ветку.

### Ручное обновление
```bash
# На сервере
cd /var/www/slydle/current
sudo -u deploy git pull origin main
sudo -u deploy npm ci --only=production
sudo -u deploy npx prisma generate
sudo -u deploy npx prisma db push
sudo -u deploy pm2 restart slydle
```

### Локальный скрипт деплоя
Для запуска деплоя прямо со своей машины используйте `scripts/deploy-local.sh`.
Перед запуском задайте переменные окружения с параметрами сервера и приложения:

```bash
SERVER_HOST=your.server \
SERVER_USER=deploy \
SERVER_PORT=22 \
SERVER_PASSWORD=your_password \
DATABASE_URL="mongodb://..." \
NEXTAUTH_SECRET="secret" \
NEXTAUTH_URL="https://example.com" \
bash scripts/deploy-local.sh
# export SERVER_HOST=your.server
# export SERVER_USER=deploy
# export SERVER_PORT=22
# export SERVER_PASSWORD=your_password
# export DATABASE_URL="mongodb://..."
# export NEXTAUTH_SECRET="secret"
# export NEXTAUTH_URL="https://example.com"

# bash scripts/deploy-local.sh
```

## 📊 Мониторинг

### Основные метрики для отслеживания
- Время отклика приложения
- Использование CPU и памяти
- Статус базы данных
- Логи ошибок
- SSL сертификаты (срок действия)

### Настройка уведомлений
Рекомендуется настроить мониторинг через:
- PM2 Plus (платный)
- Uptime Robot (бесплатный)
- New Relic (платный)

## 🔐 Безопасность

### Рекомендации
1. Регулярно обновляйте систему
2. Используйте fail2ban для защиты от brute-force атак
3. Настройте автоматическое обновление SSL сертификатов
4. Регулярно меняйте пароли базы данных
5. Используйте strong secrets для NextAuth
6. Настройте регулярные бэкапы базы данных

### Бэкапы базы данных
```bash
# Создание бэкапа MongoDB
mongodump --uri="mongodb://slydle_user:пароль@localhost:27017/slydle" --out=/backup/$(date +%Y%m%d)

# Автоматические бэкапы (добавьте в crontab)
0 2 * * * mongodump --uri="mongodb://slydle_user:пароль@localhost:27017/slydle" --out=/backup/$(date +\%Y\%m\%d)
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи приложения и сервера
2. Убедитесь, что все сервисы запущены
3. Проверьте конфигурацию Nginx и PM2
4. Обратитесь к документации выше 
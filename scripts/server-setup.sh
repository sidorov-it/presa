#!/bin/bash

# Скрипт для настройки Debian сервера для деплоя Next.js приложения
# Запускать с правами sudo

set -e

echo "🚀 Настройка сервера для Slydle..."

# Обновляем систему
echo "📦 Обновляем пакеты..."
apt update && apt upgrade -y

# Устанавливаем необходимые пакеты
echo "🔧 Устанавливаем базовые пакеты..."
apt install -y curl wget git ufw fail2ban htop nano vim

# Настраиваем UFW (файрвол)
echo "🔒 Настраиваем файрвол..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Устанавливаем Node.js 18
echo "📱 Устанавливаем Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Устанавливаем PM2 глобально
echo "⚡ Устанавливаем PM2..."
npm install -g pm2

# Создаем пользователя deploy
useradd -m -s /bin/bash deploy
usermod -aG sudo deploy

# Настраиваем PM2 для автозапуска
pm2 startup systemd -u deploy --hp /home/deploy
systemctl enable pm2-deploy

# Устанавливаем Nginx
echo "🌐 Устанавливаем Nginx..."
apt install -y nginx

# Создаем пользователя для приложения (если не существует)
if ! id "www-data" &>/dev/null; then
    useradd -r -s /bin/false www-data
fi

# Создаем директории
echo "📁 Создаем директории..."
mkdir -p /var/www/slydle
mkdir -p /var/log/slydle
chown -R deploy:deploy /var/www/slydle
chown -R deploy:deploy /var/log/slydle

# Настраиваем Nginx
echo "⚙️  Настраиваем Nginx..."
cat > /etc/nginx/sites-available/slydle << 'EOL'
server {
    listen 80;
    server_name slydle.ru www.slydle.ru;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name slydle.ru www.slydle.ru;
    
    # SSL сертификаты (настроить после получения)
    # ssl_certificate /etc/letsencrypt/live/slydle.ru/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/slydle.ru/privkey.pem;
    
    # Базовые SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Логи
    access_log /var/log/nginx/slydle_access.log;
    error_log /var/log/nginx/slydle_error.log;
    
    # Основная прокси настройка
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Статические файлы
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Favicon и роботы
    location ~ ^/(favicon\.ico|robots\.txt)$ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=86400";
    }
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Максимальный размер загружаемых файлов
    client_max_body_size 50M;
}
EOL

# Включаем сайт
ln -sf /etc/nginx/sites-available/slydle /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию Nginx
nginx -t

# Перезапускаем Nginx
systemctl enable nginx
systemctl restart nginx

# Устанавливаем MongoDB (опционально, если база локальная)
read -p "Установить MongoDB локально? (y/N): " install_mongo
if [[ $install_mongo =~ ^[Yy]$ ]]; then
    echo "🗄️  Устанавливаем MongoDB..."
    
    # Добавляем репозиторий MongoDB
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    apt update
    apt install -y mongodb-org
    
    # Запускаем MongoDB
    systemctl enable mongod
    systemctl start mongod
    
    # Создаем пользователя для базы данных
    echo "Создайте пользователя для MongoDB:"
    echo "mongosh"
    echo "use slydle"
    echo 'db.createUser({user: "slydle_user", pwd: "enexub532", roles: [{role: "readWrite", db: "slydle"}]})'
fi

# Устанавливаем Certbot для SSL (Let's Encrypt)
echo "🔐 Устанавливаем Certbot..."
apt install -y certbot python3-certbot-nginx

echo ""
echo "✅ Базовая настройка сервера завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Настройте DNS записи для вашего домена"
echo "2. Получите SSL сертификат: certbot --nginx -d ваш-домен.com"
echo "3. Добавьте SSH ключ для GitHub Actions"
echo "4. Настройте secrets в GitHub"
echo "5. Настройте строку подключения к базе данных"
echo ""
echo "🔑 Для GitHub Actions нужны следующие secrets:"
echo "- HOST: IP адрес сервера"
echo "- USERNAME: deploy"
echo "- PRIVATE_KEY: приватный SSH ключ"
echo "- PORT: 22 (или другой SSH порт)"
echo "- DATABASE_URL: строка подключения к MongoDB"
echo "- NEXTAUTH_SECRET: секретный ключ для NextAuth"
echo "- NEXTAUTH_URL: https://slydle.ru" 
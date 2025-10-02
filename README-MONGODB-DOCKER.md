# MongoDB в Docker для Prisma

## Настройка MongoDB в Docker с поддержкой Replica Set

Prisma требует, чтобы MongoDB работал в режиме replica set для поддержки транзакций. Этот документ объясняет, как настроить MongoDB в Docker с поддержкой replica set.

### Структура файлов

- `docker-compose.yml` - конфигурация Docker для запуска MongoDB с replica set
- `mongo-init.js` - скрипт инициализации MongoDB при запуске контейнера
- `init-replica.sh` - скрипт для ручной инициализации replica set, если автоматическая не сработала

### Запуск MongoDB в Docker

1. Остановите существующий контейнер MongoDB, если он запущен:
   ```bash
   docker stop имя-вашего-контейнера
   ```

2. Запустите новую конфигурацию:
   ```bash
   docker-compose up -d
   ```

3. Если при проверке статуса replica set вы видите ошибку "no replset config has been received", выполните скрипт ручной инициализации:
   ```bash
   chmod +x init-replica.sh
   ./init-replica.sh
   ```

4. Проверьте, что replica set инициализирован:
   ```bash
   docker exec -it mongodb-replica mongosh --eval "rs.status()"
   ```

5. Обновите вашу строку подключения в файле `.env.local`:
   ```
   DATABASE_URL="mongodb://localhost:27017/slydle?replicaSet=rs0"
   ```

### Решение распространенных проблем

#### Ошибка "no replset config has been received"

Если вы видите ошибку "no replset config has been received", это означает, что MongoDB запущен, но replica set не инициализирован. Для решения:

1. Выполните ручную инициализацию:
   ```bash
   docker exec mongodb-replica mongosh --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})'
   ```

2. Проверьте статус после инициализации:
   ```bash
   docker exec mongodb-replica mongosh --eval 'rs.status()'
   ```

#### Ошибка подключения в Prisma

Если Prisma все равно не может подключиться к MongoDB, проверьте:

1. Что строка подключения правильная:
   ```
   DATABASE_URL="mongodb://localhost:27017/slydle?replicaSet=rs0"
   ```

2. Что replica set действительно работает:
   ```bash
   docker exec mongodb-replica mongosh --eval 'rs.status().ok'
   ```
   Должно вернуть `1` если все работает.

3. Попробуйте добавить `directConnection=true` в строку подключения:
   ```
   DATABASE_URL="mongodb://localhost:27017/slydle?directConnection=true&replicaSet=rs0"
   ```

### Проверка работы replica set

```bash
# Подключение к MongoDB в контейнере
docker exec -it mongodb-replica mongosh

# В консоли MongoDB:
rs.status()  # Проверка статуса replica set
db.version() # Проверка версии MongoDB
```

### Полный сброс, если ничего не помогает

Если ничего из вышеперечисленного не помогает, выполните полный сброс:

```bash
# Остановите контейнер
docker-compose down

# Удалите том с данными (это удалит все ваши данные!)
docker volume rm presa3_mongodb_data

# Перезапустите контейнер
docker-compose up -d

# Запустите скрипт инициализации
./init-replica.sh
``` 
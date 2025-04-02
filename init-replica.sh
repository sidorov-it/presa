#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Ожидание запуска MongoDB контейнера...${NC}"
sleep 5

echo -e "${YELLOW}Проверка статуса контейнера...${NC}"
if ! docker ps | grep -q mongodb; then
  echo -e "${RED}Контейнер mongodb не запущен. Запустите его сначала:${NC}"
  echo -e "docker-compose up -d"
  exit 1
fi

echo -e "${YELLOW}Инициализация replica set...${NC}"
docker exec mongodb mongosh --eval '
  try {
    rs.status();
    print("Replica set уже инициализирован");
  } catch (err) {
    print("Инициализация replica set...");
    rs.initiate({
      _id: "rs0",
      members: [
        { _id: 0, host: "localhost:27017" }
      ]
    });
  }
'

echo -e "${YELLOW}Подождите, пока replica set стабилизируется...${NC}"
sleep 5

echo -e "${YELLOW}Проверка статуса replica set...${NC}"
docker exec mongodb mongosh --eval 'rs.status()'

echo -e "${GREEN}Готово! Проверьте вашу строку подключения в .env.local:${NC}"
echo 'DATABASE_URL="mongodb://localhost:27017/presa3?replicaSet=rs0"'

echo -e "${YELLOW}Для проверки доступа к базе данных:${NC}"
echo "docker exec -it mongodb mongosh"

echo -e "${YELLOW}Для подключения через MongoDB Compass используйте:${NC}"
echo "mongodb://localhost:27017/presa3?replicaSet=rs0" 
#!/bin/bash

# This script sets up a MongoDB replica set for development
# Usage: bash scripts/setup-mongo-replica.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up MongoDB as a replica set for Prisma compatibility...${NC}"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo -e "${RED}MongoDB is not installed. Please install MongoDB first.${NC}"
    exit 1
fi

# Create data directory if it doesn't exist
DATA_DIR="$HOME/data/mongodb"
mkdir -p "$DATA_DIR"
echo -e "${GREEN}Created data directory at $DATA_DIR${NC}"

# Create config file
CONFIG_FILE="$HOME/mongod-replica.conf"
cat > "$CONFIG_FILE" << EOF
storage:
  dbPath: $DATA_DIR
net:
  bindIp: localhost
  port: 27017
replication:
  replSetName: rs0
EOF

echo -e "${GREEN}Created MongoDB replica set config at $CONFIG_FILE${NC}"

# Stop any running MongoDB instance
echo -e "${YELLOW}Stopping any running MongoDB instance...${NC}"
if command -v brew &> /dev/null; then
    # macOS with Homebrew
    brew services stop mongodb-community 2>/dev/null || true
else
    # Linux
    sudo systemctl stop mongod 2>/dev/null || true
    sudo service mongod stop 2>/dev/null || true
fi

# Start MongoDB with the replica set config
echo -e "${YELLOW}Starting MongoDB with replica set configuration...${NC}"
mongod --config "$CONFIG_FILE" --fork --logpath "$DATA_DIR/mongod.log"

# Wait for MongoDB to start
echo -e "${YELLOW}Waiting for MongoDB to start...${NC}"
sleep 5

# Initialize the replica set
echo -e "${YELLOW}Initializing replica set...${NC}"
mongosh --eval "rs.initiate()"

# Update .env file
ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
    # Check if DATABASE_URL exists
    if grep -q "DATABASE_URL" "$ENV_FILE"; then
        # Replace the existing DATABASE_URL
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"mongodb://localhost:27017/slydle?replicaSet=rs0\"|g" "$ENV_FILE"
        rm -f "$ENV_FILE.bak"
    else
        # Add DATABASE_URL to the end of the file
        echo "DATABASE_URL=\"mongodb://localhost:27017/slydle?replicaSet=rs0\"" >> "$ENV_FILE"
    fi
    echo -e "${GREEN}Updated $ENV_FILE with replica set connection string${NC}"
else
    # Create a new .env file
    echo "DATABASE_URL=\"mongodb://localhost:27017/slydle?replicaSet=rs0\"" > "$ENV_FILE"
    echo -e "${GREEN}Created $ENV_FILE with replica set connection string${NC}"
fi

echo -e "${GREEN}MongoDB replica set setup complete!${NC}"
echo -e "${YELLOW}To verify the replica set status, run: ${NC}mongosh --eval \"rs.status()\""
echo -e "${YELLOW}Your MongoDB connection string is now: ${NC}mongodb://localhost:27017/slydle?replicaSet=rs0" 
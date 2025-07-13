#!/bin/bash

# Build and deploy the application from local machine.
# Requires SSH access to the server and the following environment variables:
#   SERVER_HOST, SERVER_USER, SERVER_PORT, SERVER_PASSWORD
#   DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

set -e

# Check required env vars
if [[ -z "$SERVER_HOST" || -z "$SERVER_USER" || -z "$SERVER_PORT" || -z "$SERVER_PASSWORD" ]]; then
  echo "SERVER_HOST, SERVER_USER, SERVER_PORT and SERVER_PASSWORD must be set"
  exit 1
fi

# Install dependencies and build the project
npm ci
npx prisma generate
npm run build

# Create deployment package similar to CircleCI pipeline
PACKAGE_DIR="deploy-package"
rm -rf "$PACKAGE_DIR" deploy-package.tar.gz
mkdir "$PACKAGE_DIR"
cp -r .next "$PACKAGE_DIR"/
cp -r public "$PACKAGE_DIR"/
cp -r prisma "$PACKAGE_DIR"/
cp package*.json "$PACKAGE_DIR"/
cp next.config.js "$PACKAGE_DIR"/
cp ecosystem.config.js "$PACKAGE_DIR"/
cp -r src "$PACKAGE_DIR"/
cp scripts/deploy.sh "$PACKAGE_DIR"/
chmod +x "$PACKAGE_DIR/deploy.sh"
tar -czf deploy-package.tar.gz "$PACKAGE_DIR"
rm -rf "$PACKAGE_DIR"

# Upload package to the server
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -P "$SERVER_PORT" deploy-package.tar.gz "$SERVER_USER@$SERVER_HOST:/var/www/slydle/"

# Run deployment script on the server
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" \
  "cd /var/www/slydle && tar -xzf deploy-package.tar.gz && DATABASE_URL='${DATABASE_URL}' NEXTAUTH_SECRET='${NEXTAUTH_SECRET}' NEXTAUTH_URL='${NEXTAUTH_URL}' ./deploy-package/deploy.sh '${DATABASE_URL}' '${NEXTAUTH_SECRET}' '${NEXTAUTH_URL}'"



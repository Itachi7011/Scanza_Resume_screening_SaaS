# Simple, easy-to-read Dockerfile for main-service.
# Built from the MONOREPO ROOT (see docker-compose.yml "context: .") because
# this service depends on the shared @scanza/database workspace package.

FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY packages/database/package.json ./packages/database/package.json
COPY services/main-service/package.json ./services/main-service/package.json

RUN npm install

COPY packages/database ./packages/database
COPY services/main-service ./services/main-service

RUN npm run db:generate

WORKDIR /app/services/main-service
RUN npm run build

EXPOSE 5002
CMD ["node", "dist/server.js"]

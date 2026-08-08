# Simple, easy-to-read Dockerfile for auth-service.
# Built from the MONOREPO ROOT (see docker-compose.yml "context: .") because
# this service depends on the shared @scanza/database workspace package.

FROM node:18-alpine

WORKDIR /app

# Copy just the manifest files first so Docker can cache `npm install`
# between builds when only source code changes (not dependencies).
COPY package.json ./
COPY packages/database/package.json ./packages/database/package.json
COPY services/auth-service/package.json ./services/auth-service/package.json

RUN npm install

# Now copy the actual source code.
COPY packages/database ./packages/database
COPY services/auth-service ./services/auth-service

# Generate the Prisma client (needs the schema which just got copied in).
RUN npm run db:generate

WORKDIR /app/services/auth-service
RUN npm run build

EXPOSE 5001
CMD ["node", "dist/server.js"]

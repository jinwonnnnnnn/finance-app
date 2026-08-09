FROM node:22-alpine AS builder

WORKDIR /app
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/ .
RUN pnpm build

# --- runtime ---
FROM node:22-alpine

RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./

COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 8080

ENTRYPOINT ["./docker-entrypoint.sh"]

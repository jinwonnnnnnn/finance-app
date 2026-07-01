FROM node:22-slim

WORKDIR /app

RUN npm install -g pnpm@9

COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/ .
RUN pnpm build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node /app/dist/src/main"]

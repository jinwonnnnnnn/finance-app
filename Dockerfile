FROM node:22-slim

WORKDIR /app

RUN npm install -g pnpm@9

COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY backend/ .
RUN npx prisma generate
RUN pnpm build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && node /app/dist/src/main"]

#!/bin/sh
set -e

# DB URL에서 호스트:포트 추출 후 최대 60초 대기
if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
  DB_PORT=${DB_PORT:-5432}
  echo "[startup] Waiting for DB at $DB_HOST:$DB_PORT..."
  RETRIES=0
  until nc -w1 "$DB_HOST" "$DB_PORT" < /dev/null 2>/dev/null || [ "$RETRIES" -ge 30 ]; do
    RETRIES=$((RETRIES + 1))
    sleep 2
  done
  if [ "$RETRIES" -ge 30 ]; then
    echo "[startup] DB not reachable after 60s, continuing anyway..."
  else
    echo "[startup] DB is up after $((RETRIES * 2))s"
  fi
fi

echo "[startup] Syncing DB schema..."
npx prisma db push 2>&1 || echo "[startup] DB push warning (may be first run)"

echo "[startup] Ensuring test user exists..."
node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const hashed = await bcrypt.hash('test', 10);
  await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {},
    create: {
      email: 'test@test.com',
      password: hashed,
      nickname: '테스트유저',
      provider: 'local',
      surveyDone: true,
    },
  });
  await prisma.\$disconnect();
  await pool.end();
  console.log('[startup] Test user ready: test@test.com / test');
})().catch(e => console.warn('[startup] Test user warning:', e.message));
" 2>&1 || echo "[startup] Test user setup skipped"

exec node dist/src/main

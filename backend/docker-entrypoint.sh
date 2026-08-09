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

exec node dist/src/main

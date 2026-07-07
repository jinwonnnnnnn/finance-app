import * as Sentry from '@sentry/nestjs';

// main.ts보다 먼저 import되어야 함 — NestJS 부트스트랩 전에 Sentry 초기화
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,
});

import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 모든 API 엔드포인트에 /api 접두사 추가 (예: /auth/login → /api/auth/login)
  app.setGlobalPrefix('api');

  // 요청 유효성 검사: DTO에 정의된 필드만 허용(whitelist), 자동 타입변환(transform)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS 설정: 프론트엔드 도메인에서 쿠키/인증헤더 포함 요청 허용
  // CLIENT_URL: 배포 시 Vercel URL, 로컬 시 localhost:5173
  app.enableCors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  // PORT: Railway가 자동 주입 (보통 8080), 로컬에서는 4000 사용
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

/**
 * PrismaService: 데이터베이스 접근을 담당하는 NestJS 서비스
 *
 * Prisma 7부터 datasource에 url을 직접 쓰지 않고
 * @prisma/adapter-pg 드라이버 어댑터 패턴을 사용해야 함.
 * TypeScript import 대신 require()를 쓰는 이유:
 *   → 빌드 환경(Railway)에서 타입 생성 전 import 오류 방지
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _client: any;

  // 각 Prisma 모델을 직접 접근할 수 있도록 getter 노출
  // 사용 예: this.prisma.user.findUnique(...)
  get user() { return this._client.user; }
  get glossary() { return this._client.glossary; }
  get watchlist() { return this._client.watchlist; }
  get alert() { return this._client.alert; }
  get post() { return this._client.post; }
  get postLike() { return this._client.postLike; }
  get comment() { return this._client.comment; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction(...args: any[]) { return this._client.$transaction(...args); }

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');
    // DATABASE_URL: Neon PostgreSQL 연결 문자열 (Railway 환경변수로 주입)
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    this._client = new PrismaClient({ adapter });
  }

  // NestJS 모듈 시작 시 DB 연결
  async onModuleInit() {
    await this._client.$connect();
  }

  // NestJS 모듈 종료 시 DB 연결 해제 (메모리 누수 방지)
  async onModuleDestroy() {
    await this._client.$disconnect();
  }
}

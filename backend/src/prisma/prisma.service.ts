import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _client: any;

  get user() { return this._client.user; }
  get glossary() { return this._client.glossary; }
  get watchlist() { return this._client.watchlist; }
  get alert() { return this._client.alert; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction(...args: any[]) { return this._client.$transaction(...args); }

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    this._client = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this._client.$connect();
  }

  async onModuleDestroy() {
    await this._client.$disconnect();
  }
}

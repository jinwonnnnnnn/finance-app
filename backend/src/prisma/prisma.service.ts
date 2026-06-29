import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
} as any);

@Injectable()
export class PrismaService extends (PrismaClient as any) implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ datasources: { db: { url: process.env.DATABASE_URL } } });
  }

  async onModuleInit() {
    await (this as any).$connect();
  }

  async onModuleDestroy() {
    await (this as any).$disconnect();
  }
}

export { prismaClient };

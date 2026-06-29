import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.watchlist.findMany({ where: { userId } });
  }

  add(userId: string, symbol: string, name: string, market: string) {
    return this.prisma.watchlist.upsert({
      where: { userId_symbol: { userId, symbol } },
      update: {},
      create: { userId, symbol, name, market },
    });
  }

  remove(userId: string, symbol: string) {
    return this.prisma.watchlist.deleteMany({ where: { userId, symbol } });
  }
}

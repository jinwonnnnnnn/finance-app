import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StockModule } from './stock/stock.module';
import { GlossaryModule } from './glossary/glossary.module';
import { AiModule } from './ai/ai.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { NewsModule } from './news/news.module';
import { CommunityModule } from './community/community.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Railway(production)에서는 .env 파일 무시 → Railway Variables만 사용
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StockModule,
    GlossaryModule,
    AiModule,
    WatchlistModule,
    NewsModule,
    CommunityModule,
  ],
})
export class AppModule {}

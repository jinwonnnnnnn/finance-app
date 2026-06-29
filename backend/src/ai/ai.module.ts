import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { InvestmentAdvisorService } from './investment-advisor.service';

@Module({
  controllers: [AiController],
  providers: [AiService, InvestmentAdvisorService],
  exports: [InvestmentAdvisorService],
})
export class AiModule {}

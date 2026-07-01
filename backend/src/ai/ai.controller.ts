import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { InvestmentAdvisorService } from './investment-advisor.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(
    private aiService: AiService,
    private advisorService: InvestmentAdvisorService,
  ) {}

  @Post('explain')
  explain(@Body() body: { term: string; context?: string }) {
    return this.aiService.explain(body.term, body.context);
  }

  @Post('recommend')
  recommend(@Body() body: { surveyResult: any }) {
    return this.aiService.recommend(body.surveyResult);
  }

  @Get('investment-advice')
  getInvestmentAdvice(@Req() req: any) {
    const interests: string[] = req.user?.interests ?? [];
    const surveyResult = req.user?.surveyResult ?? {};
    return this.advisorService.getAdvice(interests, surveyResult);
  }

  @Post('chat')
  chat(@Body() body: { messages: { role: 'user' | 'assistant'; content: string }[] }) {
    return this.aiService.chat(body.messages ?? []);
  }

  @Get('daily-content')
  getDailyContent(@Req() req: any) {
    const interests: string[] = req.user?.interests ?? [];
    const surveyResult = req.user?.surveyResult ?? {};
    return this.aiService.getDailyContent(interests, surveyResult);
  }
}

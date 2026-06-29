import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('explain')
  explain(@Body() body: { term: string; context?: string }) {
    return this.aiService.explain(body.term, body.context);
  }

  @Post('recommend')
  recommend(@Body() body: { surveyResult: any }) {
    return this.aiService.recommend(body.surveyResult);
  }
}

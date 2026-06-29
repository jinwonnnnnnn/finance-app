import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NewsService } from './news.service';

@Controller('news')
@UseGuards(AuthGuard('jwt'))
export class NewsController {
  constructor(private newsService: NewsService) {}

  /** GET /api/news?category=general */
  @Get()
  getNews(@Query('category') category = 'general') {
    return this.newsService.getNews(category);
  }
}

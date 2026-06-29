import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number; // Unix timestamp
  category: string;
  related: string;  // 관련 주식 티커 (예: 'AAPL,TSLA')
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(private config: ConfigService) {}

  /**
   * Finnhub에서 금융 뉴스 목록을 가져옴
   * category: 'general' | 'forex' | 'crypto' | 'merger'
   */
  async getNews(category = 'general'): Promise<NewsItem[]> {
    try {
      const token = this.config.get('FINNHUB_TOKEN');
      const { data } = await axios.get('https://finnhub.io/api/v1/news', {
        params: { category, token },
        timeout: 8000,
      });

      if (!Array.isArray(data)) return [];

      return data
        .filter((n: any) => n.headline && n.url)
        .slice(0, 30)
        .map((n: any) => ({
          id: n.id,
          headline: n.headline,
          summary: n.summary ?? '',
          source: n.source ?? 'Unknown',
          url: n.url,
          image: n.image ?? '',
          datetime: n.datetime,
          category: n.category ?? category,
          related: n.related ?? '',
        }));
    } catch (e) {
      this.logger.error('뉴스 가져오기 실패', e);
      return [];
    }
  }
}

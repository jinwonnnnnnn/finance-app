import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class InvestmentAdvisorService {
  private readonly logger = new Logger(InvestmentAdvisorService.name);
  private client: Anthropic;

  constructor(private config: ConfigService) {
    this.client = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
  }

  async getMarketNews(): Promise<string> {
    const token = this.config.get('FINNHUB_TOKEN');
    const { data } = await axios.get('https://finnhub.io/api/v1/news', {
      params: { category: 'general', token },
    });
    const top5 = (data as any[]).slice(0, 5);
    return top5
      .map((n: any) => `- [${n.source}] ${n.headline}`)
      .join('\n');
  }

  async getAdvice(interests: string[], surveyResult: any): Promise<{
    headline: string;
    suggestion: string;
    portfolioIdea: string;
    riskNote: string;
    newsContext: string;
  }> {
    const news = await this.getMarketNews().catch(() => '뉴스 데이터를 가져오지 못했습니다.');

    const interestLabel = interests.map((i) => ({
      STOCK_KR: '국내주식',
      STOCK_US: '해외주식',
      COIN: '암호화폐',
      PENSION: '퇴직연금/IRP',
    }[i] ?? i)).join(', ');

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: `당신은 금융감독원 기준을 따르는 투자 어드바이저입니다.
세계 경제 뉴스와 사용자의 투자 성향을 분석하여 맞춤형 투자 제안을 합니다.
반드시 다음 JSON 형식으로만 응답하세요 (마크다운 없이):
{
  "headline": "한 줄 현재 시장 요약",
  "suggestion": "2-3문장 투자 제안 (초보자 눈높이)",
  "portfolioIdea": "구체적 포트폴리오 비중 제안 (예: 국내ETF 40% + 미국ETF 30% + 현금 30%)",
  "riskNote": "주의할 리스크 한 가지",
  "newsContext": "뉴스에서 가장 중요한 포인트 한 문장"
}`,
      messages: [
        {
          role: 'user',
          content: `사용자 관심 분야: ${interestLabel}
투자 성향 설문: ${JSON.stringify(surveyResult ?? {})}

최신 시장 뉴스:
${news}

위 정보를 바탕으로 지금 이 사용자에게 적합한 투자 제안을 해주세요.`,
        },
      ],
    });

    const text = (message.content[0] as any).text;
    try {
      return JSON.parse(text);
    } catch {
      return {
        headline: '시장 분석 중',
        suggestion: text,
        portfolioIdea: '분산투자를 권장합니다.',
        riskNote: '투자는 원금 손실 위험이 있습니다.',
        newsContext: news.split('\n')[0],
      };
    }
  }
}

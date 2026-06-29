import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class InvestmentAdvisorService {
  private readonly logger = new Logger(InvestmentAdvisorService.name);
  private client: Anthropic;

  constructor(private config: ConfigService) {
    // Claude API 클라이언트 초기화 (ANTHROPIC_API_KEY 환경변수 사용)
    this.client = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
  }

  /**
   * Finnhub에서 글로벌 경제 뉴스 가져오기
   * 실패 시 기본 텍스트로 대체 (Claude 호출은 계속 진행)
   */
  async getMarketNews(): Promise<string> {
    try {
      const token = this.config.get('FINNHUB_TOKEN');
      const { data } = await axios.get('https://finnhub.io/api/v1/news', {
        params: { category: 'general', token },
        timeout: 5000,
      });
      const items = Array.isArray(data) ? data.slice(0, 5) : [];
      if (items.length === 0) return '현재 뉴스 데이터를 가져오지 못했습니다.';
      return items.map((n: any) => `- [${n.source}] ${n.headline}`).join('\n');
    } catch (e) {
      this.logger.warn('뉴스 가져오기 실패, 기본값 사용');
      return '글로벌 시장은 금리와 AI 기술주 흐름에 영향을 받고 있습니다.';
    }
  }

  /**
   * AI 투자 제안 생성
   * 1. Finnhub에서 최신 뉴스 수집
   * 2. 사용자 관심사 + 뉴스를 Claude에 전달
   * 3. 구조화된 JSON 응답 파싱 후 반환
   *
   * 프론트에서 30분 캐시(staleTime)로 Claude 호출 빈도 제한
   */
  async getAdvice(interests: string[], surveyResult: any): Promise<{
    headline: string;     // 한 줄 시장 요약
    suggestion: string;   // 투자 제안 (2-3문장)
    portfolioIdea: string; // 구체적 포트폴리오 비중
    riskNote: string;     // 주의할 리스크
    newsContext: string;  // 뉴스 핵심 포인트
  }> {
    const news = await this.getMarketNews().catch(() => '뉴스 데이터를 가져오지 못했습니다.');

    // 내부 코드(STOCK_KR 등)를 사람이 읽을 수 있는 한국어로 변환
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
      // Claude가 올바른 JSON을 반환하면 그대로 파싱
      return JSON.parse(text);
    } catch {
      // JSON 파싱 실패 시 텍스트를 suggestion 필드에 넣어 안전하게 반환
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

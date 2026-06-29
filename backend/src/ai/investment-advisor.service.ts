import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import Groq from 'groq-sdk';

@Injectable()
export class InvestmentAdvisorService {
  private readonly logger = new Logger(InvestmentAdvisorService.name);
  private client: Groq;
  private model: string;

  constructor(private config: ConfigService) {
    // Groq 무료 API: 빠른 추론, llama-3.3-70b-versatile 모델 사용
    this.client = new Groq({ apiKey: this.config.get('GROQ_API_KEY') });
    this.model = this.config.get('GROQ_CHAT_MODEL') ?? 'llama-3.3-70b-versatile';
  }

  /**
   * Finnhub에서 글로벌 경제 뉴스 가져오기
   * 실패 시 기본 텍스트로 대체 (AI 호출은 계속 진행)
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
   * AI 투자 제안 생성 (Groq / llama-3.3-70b-versatile)
   * 1. Finnhub에서 최신 뉴스 수집
   * 2. 사용자 관심사 + 뉴스를 AI에 전달
   * 3. 구조화된 JSON 응답 파싱 후 반환
   *
   * 프론트에서 30분 캐시(staleTime)로 AI 호출 빈도 제한
   */
  async getAdvice(interests: string[], surveyResult: any): Promise<{
    headline: string;
    suggestion: string;
    portfolioIdea: string;
    riskNote: string;
    newsContext: string;
  }> {
    const news = await this.getMarketNews().catch(() => '뉴스 데이터를 가져오지 못했습니다.');

    // 내부 코드(STOCK_KR 등)를 사람이 읽을 수 있는 한국어로 변환
    const interestLabel = interests.map((i) => ({
      STOCK_KR: '국내주식',
      STOCK_US: '해외주식',
      COIN: '암호화폐',
      PENSION: '퇴직연금/IRP',
    }[i] ?? i)).join(', ');

    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `당신은 금융감독원 기준을 따르는 투자 어드바이저입니다.
세계 경제 뉴스와 사용자의 투자 성향을 분석하여 맞춤형 투자 제안을 합니다.
반드시 다음 JSON 형식으로만 응답하세요 (마크다운 없이):
{
  "headline": "한 줄 현재 시장 요약",
  "suggestion": "2-3문장 투자 제안 (초보자 눈높이)",
  "portfolioIdea": "구체적 포트폴리오 비중 제안 (예: 국내ETF 40% + 미국ETF 30% + 현금 30%)",
  "riskNote": "주의할 리스크 한 가지",
  "newsContext": "뉴스에서 가장 중요한 포인트 한 문장"
}`,
        },
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

    const text = completion.choices[0].message.content ?? '';
    try {
      // JSON 코드블록 있으면 제거 후 파싱
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
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

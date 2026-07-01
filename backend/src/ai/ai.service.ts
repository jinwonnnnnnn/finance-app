import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

const INTEREST_MAP: Record<string, string> = {
  STOCK_KR: '국내주식',
  STOCK_US: '해외주식',
  COIN: '암호화폐',
  PENSION: '퇴직연금/IRP',
};

@Injectable()
export class AiService {
  private _client: Groq | null = null;
  private model: string;

  constructor(private config: ConfigService) {
    this.model = this.config.get('GROQ_CHAT_MODEL') ?? 'llama-3.3-70b-versatile';
  }

  private get client(): Groq {
    if (!this._client) {
      const apiKey = this.config.get<string>('GROQ_API_KEY');
      if (!apiKey) throw new Error('GROQ_API_KEY is not set');
      this._client = new Groq({ apiKey });
    }
    return this._client;
  }

  async explain(term: string, context?: string) {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content:
            '당신은 금융 초보자를 위한 친절한 선생님입니다. 금융감독원, 한국은행 등 공신력 있는 기관의 정의를 기반으로 설명하세요. 반드시 다음 3가지 파트로 답변하세요:\n\n**한 줄 설명**: 초등학생도 이해할 수 있게\n**쉬운 비유**: 일상 생활에서 비슷한 예시\n**주의할 점**: 투자 시 꼭 알아야 할 주의사항\n\n답변은 짧고 명확하게, 전문용어는 괄호로 간단히 설명해주세요.',
        },
        {
          role: 'user',
          content: context
            ? `"${term}"에 대해 설명해줘. 추가 맥락: ${context}`
            : `"${term}"이 무엇인지 설명해줘.`,
        },
      ],
    });

    return { explanation: completion.choices[0].message.content ?? '' };
  }

  async recommend(surveyResult: any) {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content:
            '당신은 금융 투자 초보자를 위한 상담사입니다. 사용자의 투자 성향 설문 결과를 바탕으로 적합한 투자 상품을 추천해주세요. 금융감독원 기준의 투자성향 분류(안정형, 안정추구형, 위험중립형, 적극투자형, 공격투자형)를 참고하세요. 추천 이유와 주의사항도 함께 제시하세요.',
        },
        {
          role: 'user',
          content: `투자 성향 설문 결과: ${JSON.stringify(surveyResult, null, 2)}\n\n이 결과를 바탕으로 적합한 투자 상품을 3가지 추천해주세요.`,
        },
      ],
    });

    return { recommendation: completion.choices[0].message.content ?? '' };
  }

  async chat(messages: { role: 'user' | 'assistant'; content: string }[]) {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content:
            `당신은 재테크 입문자 전담 AI 금융 상담사 '핀이'입니다. 친근하고 따뜻한 어조로 상담하되, 다음 원칙을 반드시 지키세요:
1. 복잡한 금융 용어는 쉽게 풀어서 설명
2. 구체적인 수익률 예측이나 특정 종목 매수/매도 권유는 절대 하지 않음
3. 초보자 눈높이에 맞는 친근한 한국어로 답변
4. 답변은 3~5문장 이내로 간결하게
5. 이모지를 적절히 활용해 친근한 분위기 연출
6. 투자 결정은 본인 책임임을 자연스럽게 인식시켜 줄 것`,
        },
        ...messages,
      ],
    });

    return { reply: completion.choices[0].message.content ?? '' };
  }

  async getDailyContent(interests: string[], surveyResult: any) {
    const interestLabels = interests.length
      ? interests.map((i) => INTEREST_MAP[i] ?? i).join(', ')
      : '주식, ETF, 기초지식';

    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content:
            '당신은 재테크 앱의 금융 교육 콘텐츠 큐레이터입니다. 반드시 순수 JSON만 응답하세요. 마크다운 코드 블록, 설명 텍스트 없이 JSON 객체만 출력하세요.',
        },
        {
          role: 'user',
          content: `사용자 관심 분야: ${interestLabels}
설문 결과 요약: ${JSON.stringify(surveyResult)}

오늘의 금융 학습 팁 4개를 다음 JSON 형식으로 생성하세요:
{"tips":[{"icon":"이모지","title":"제목(10자이내)","body":"핵심팁(40자이내)","category":"카테고리"}]}

카테고리는 관심 분야에서 선택: 주식기초, ETF, 코인, 퇴직연금, 절세팁, 투자원칙`,
        },
      ],
    });

    const raw = (completion.choices[0].message.content ?? '')
      .replace(/```json\n?|\n?```/g, '')
      .trim();
    try {
      return JSON.parse(raw);
    } catch {
      return { tips: [] };
    }
  }
}

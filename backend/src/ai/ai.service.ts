import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(private config: ConfigService) {
    this.client = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
  }

  async explain(term: string, context?: string) {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system:
        '당신은 금융 초보자를 위한 친절한 선생님입니다. 금융감독원, 한국은행 등 공신력 있는 기관의 정의를 기반으로 설명하세요. 반드시 다음 3가지 파트로 답변하세요:\n\n**한 줄 설명**: 초등학생도 이해할 수 있게\n**쉬운 비유**: 일상 생활에서 비슷한 예시\n**주의할 점**: 투자 시 꼭 알아야 할 주의사항\n\n답변은 짧고 명확하게, 전문용어는 괄호로 간단히 설명해주세요.',
      messages: [
        {
          role: 'user',
          content: context
            ? `"${term}"에 대해 설명해줘. 추가 맥락: ${context}`
            : `"${term}"이 무엇인지 설명해줘.`,
        },
      ],
    });

    return { explanation: (message.content[0] as any).text };
  }

  async recommend(surveyResult: any) {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system:
        '당신은 금융 투자 초보자를 위한 상담사입니다. 사용자의 투자 성향 설문 결과를 바탕으로 적합한 투자 상품을 추천해주세요. 금융감독원 기준의 투자성향 분류(안정형, 안정추구형, 위험중립형, 적극투자형, 공격투자형)를 참고하세요. 추천 이유와 주의사항도 함께 제시하세요.',
      messages: [
        {
          role: 'user',
          content: `투자 성향 설문 결과: ${JSON.stringify(surveyResult, null, 2)}\n\n이 결과를 바탕으로 적합한 투자 상품을 3가지 추천해주세요.`,
        },
      ],
    });

    return { recommendation: (message.content[0] as any).text };
  }
}

---
name: ai-invest-analyze
description: Groq AI 기반 투자 분석 고도화 스킬. "AI 분석", "Groq", "뉴스 요약", "투자 추천", "용어 설명", "포트폴리오 진단", "성향 분석" 등 AI 기능 관련 요청 시 반드시 이 스킬을 사용할 것. AI 기능 추가, 프롬프트 개선, 응답 품질 향상 요청에도 트리거.
---

# Groq AI 투자 분석 고도화

Groq SDK를 활용해 재테크 입문자에게 실질적인 AI 분석 기능을 제공한다.

## 현재 구현 상태

```
backend/src/ai/ai.service.ts  ← Groq SDK 호출
POST /ai/explain              ← 용어 설명
GET /news/summary             ← 뉴스 AI 요약
```

## 강화할 AI 기능

### 1. 종목 AI 분석 리포트

**엔드포인트**: `POST /ai/analyze { symbol, market }`

**프롬프트 전략**:
```typescript
const systemPrompt = `당신은 재테크 입문자를 위한 친절한 투자 도우미입니다.
다음 규칙을 반드시 지키세요:
1. 전문 용어는 괄호 안에 쉬운 설명을 추가 (예: PER(주가수익비율))
2. 응답 마지막에 "이 내용은 투자 권유가 아닌 정보 제공입니다"를 추가
3. 200자 이내로 간결하게
4. 확실하지 않은 내용은 "참고로" 접두사 사용`;

const userPrompt = `종목: ${symbol}
현재가: ${quote.current}
52주 변동: 최고 ${quote.high52w} / 최저 ${quote.low52w}
최근 뉴스: ${news.slice(0,2).map(n => n.headline).join(', ')}

위 정보를 바탕으로 이 종목의 현황을 쉽게 설명해주세요.`;
```

### 2. 투자 성향별 ETF 추천

**엔드포인트**: `POST /ai/recommend { riskLevel: 'low'|'medium'|'high' }`

성향별 추천 로직:
- 안전형(low): 채권 ETF, 배당주 ETF
- 균형형(medium): S&P 500 ETF, KOSPI ETF
- 공격형(high): 나스닥 레버리지, 테마 ETF

### 3. 뉴스 감성 분석

Finnhub 뉴스 → Groq로 감성 분류:
```typescript
`다음 뉴스 헤드라인의 감성을 분석해주세요:
"${headline}"
응답 형식: { "sentiment": "positive"|"negative"|"neutral", "reason": "한줄 이유" }`
```

### 4. 대화형 Q&A (컨텍스트 유지)

```typescript
const messages = [
  { role: 'system', content: systemPrompt },
  ...chatHistory,  // 이전 대화 유지
  { role: 'user', content: userQuestion }
];
const response = await groq.chat.completions.create({ model, messages });
```

## Groq SDK 사용 패턴

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: this.config.get('GROQ_API_KEY') });

const response = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages,
  max_tokens: 300,
  temperature: 0.3,  // 낮을수록 일관성 있는 응답
});
return response.choices[0].message.content;
```

## 스트리밍 응답 (긴 분석용)

```typescript
const stream = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages,
  stream: true,
});

// NestJS SSE 또는 WebSocket으로 프론트에 전달
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content ?? '';
  // emit to client
}
```

## 품질 기준

- 응답 200자 이내 (입문자는 긴 텍스트 기피)
- 전문용어 괄호 설명 필수
- 면책 문구 포함
- 할루시네이션 방지를 위해 실제 데이터를 프롬프트에 포함

## 참고 파일

- `references/prompt-templates.md` — 검증된 프롬프트 템플릿 모음

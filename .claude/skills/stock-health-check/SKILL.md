---
name: stock-health-check
description: 주식 API 데이터 품질 점검 스킬. "주가 이상해", "가격 0원", "데이터 안나와", "API 오류", "403", "Yahoo Finance 에러", "Finnhub 안됨", "KR 주식 문제" 등 데이터 관련 이상 증상 보고 시 반드시 이 스킬을 사용할 것. 점검, 진단, 모니터링 요청에도 트리거.
---

# 주식 API 데이터 품질 점검

Finnhub(US)와 Yahoo Finance(KR) API 상태 및 데이터 이상을 체계적으로 진단한다.

## 점검 순서

### 1. 라우팅 점검 (가장 흔한 원인)

`backend/src/stock/stock.service.ts` 확인:
```typescript
// 올바른 라우팅 — KR 주식은 반드시 Yahoo로
async getQuote(symbol: string, market = 'US') {
  if (market === 'KR' || /^\d{6}$/.test(symbol)) return this.getQuoteYahoo(symbol);
  return this.getQuoteFinnhub(symbol);
}
```

`frontend/src/components/ui/StockCard.tsx` 확인:
```typescript
// market 파라미터가 API 호출에 포함되어야 함
queryFn: () => api.get(`/stock/${symbol}/quote`, { params: { market } })
```

### 2. 가격 null 처리 점검

```typescript
// 올바른 fallback
const current = data.regularMarketPrice ?? data.regularMarketPreviousClose ?? 0;
```

장 마감 시간(KST 기준 평일 15:30 이후)에는 `regularMarketPrice`가 null이다.

### 3. 검색 결과 점검

```typescript
// KR 종목 필터 확인
const quotes = (results.quotes ?? []).filter(
  (q: any) => ['KSC', 'KOE', 'KSE'].includes(q.exchange) ||
    (q.symbol && /^\d{6}\.(KS|KQ)$/.test(q.symbol)),
);
```

### 4. 차트 인터벌 매핑 점검

```typescript
const intervalMap = {
  '5': '5m', '60': '60m', 'D': '1d', 'W': '1wk', 'M': '1mo',
};
```

## 이상 증상 → 원인 → 수정 가이드

| 증상 | 원인 | 수정 위치 |
|-----|-----|---------|
| 가격 `$0.00` / `₩0` | regularMarketPrice null | stock.service.ts:94 |
| 403 Forbidden 로그 | KR → Finnhub 라우팅 | StockCard.tsx market prop |
| 검색 결과 없음 | exchange 필터 | stock.service.ts:47-50 |
| 차트 데이터 빈 배열 | 인터벌 매핑 or date 범위 | stock.service.ts:141 |
| Yahoo 연결 거부 | IP 차단 의심 | User-Agent 헤더 추가 |

## 출력 형식

진단 결과를 심각도 순으로 정렬해 제시한다:
- [심각] — 데이터 완전 없음
- [경고] — 부정확한 데이터
- [정보] — 개선 가능한 항목

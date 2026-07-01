---
name: feature-expand
description: KR/US 주식 기능 확장 구현 스킬. "포트폴리오 추가", "가격 알림", "새 지표", "차트 개선", "관심종목", "52주 최고", "거래량", "비교 차트" 등 새 기능 구현 요청 시 반드시 이 스킬을 사용할 것. 프론트(React)와 백엔드(NestJS) 모두 다룬다. 기능 추가, 기능 수정, 기능 확장 요청에 트리거.
---

# 주식 기능 확장 구현

재테크 앱에 새 기능을 추가한다. 입문자 친화적 UI와 올바른 KR/US 분기 처리가 핵심이다.

## 구현 체크리스트 (모든 기능 공통)

- [ ] `market` prop/파라미터 전달 확인
- [ ] KR 통화: `₩${Math.floor(price).toLocaleString()}`, US: `$${price.toFixed(2)}`
- [ ] TanStack Query `staleTime` 설정 (주가: 30초, 차트: 5분, 정적 데이터: Infinity)
- [ ] 모바일 반응형 (Tailwind sm: breakpoint)
- [ ] 로딩 스켈레톤 or `—` 대체 표시

## 기능별 구현 가이드

### 포트폴리오 트래커

**백엔드**: `POST /portfolio { symbol, market, quantity, avgPrice }`
**프론트**: 보유 수량 × 현재가 = 평가금액, 수익률 = (현재가 - 평균가) / 평균가

### 가격 알림

**백엔드**: Alert 모델 (Prisma schema 이미 있음), WebSocket Gateway에서 가격 체크
**프론트**: 알림 설정 모달, 도달 시 toast 알림

### 52주 최고/최저가

Yahoo Finance: `data.fiftyTwoWeekHigh`, `data.fiftyTwoWeekLow`
Finnhub: `GET /stock/metric?symbol=AAPL&metric=all` → `metric.52WeekHigh`

### 섹터/산업 표시

Yahoo Finance: `data.sector`, `data.industry`
Finnhub: `GET /stock/profile2?symbol=AAPL` → `finnhubIndustry`

### 복수 종목 비교 차트

Recharts `LineChart` + 복수 `Line` 컴포넌트, 각 종목 색상 구분

## 코드 패턴

### 새 API 엔드포인트 (NestJS)

```typescript
@Get(':symbol/metrics')
getMetrics(@Param('symbol') symbol: string, @Query('market') market = 'US') {
  return this.stockService.getMetrics(symbol, market);
}
```

### 새 훅 (React)

```typescript
const { data: metrics } = useQuery({
  queryKey: ['metrics', symbol, market],
  queryFn: () => api.get(`/stock/${symbol}/metrics`, { params: { market } }).then(r => r.data),
  staleTime: 5 * 60 * 1000,
});
```

## 참고 파일

- `references/ui-patterns.md` — Tailwind 컴포넌트 패턴 (색상, 카드, 모달)

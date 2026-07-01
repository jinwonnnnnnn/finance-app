# 재테크 앱 프로젝트 컨텍스트

## 스택

| 영역 | 기술 |
|-----|-----|
| 프론트엔드 | React 18 + TypeScript + Vite, Tailwind CSS, TanStack Query |
| 백엔드 | NestJS + TypeScript + Prisma |
| DB | PostgreSQL (Railway) |
| 주식 US | Finnhub REST API (무료, 1분당 60 요청) |
| 주식 KR | Yahoo Finance (yahoo-finance2 v3, Node 22 필요) |
| AI | Groq SDK (llama-3.3-70b-versatile) |
| 배포 | Vercel (프론트) + Railway (백엔드) |

## 핵심 파일 맵

```
frontend/
  src/pages/stock/StockPage.tsx     ← 종목 검색 + 차트
  src/pages/home/HomePage.tsx       ← 대시보드
  src/components/ui/StockCard.tsx   ← 종목 카드 (market prop 필수!)
  src/components/layout/Navbar.tsx  ← 네비게이션
  src/lib/api.ts                    ← axios base URL
  vercel.json                       ← API 프록시 설정

backend/
  src/stock/stock.service.ts        ← Finnhub + Yahoo Finance
  src/stock/stock.controller.ts     ← GET /stock/:symbol/quote?market=KR
  src/ai/ai.service.ts              ← Groq SDK
  src/ai/ai.controller.ts           ← POST /ai/explain
  prisma/schema.prisma              ← User, Glossary, Watchlist, Alert
```

## 알려진 이슈 패턴

- KR 주식 6자리 숫자 (`/^\d{6}$/`) → Yahoo Finance 라우팅 (Finnhub 아님)
- `regularMarketPrice` null (장 마감) → `regularMarketPreviousClose` fallback
- StockCard에 `market` prop 누락 → KR 주식이 US로 처리됨
- Yahoo Finance exchange: `['KSC', 'KOE', 'KSE']` 또는 `/^\d{6}\.(KS|KQ)$/`

## 배포 URL

- 프론트: https://finance-app-jw.vercel.app
- 백엔드: https://precious-gentleness-production.up.railway.app

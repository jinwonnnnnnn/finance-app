# Frontend — React + Vite + TypeScript

재테크 학습 앱 프론트엔드. 루트 README를 참고하세요: [../README.md](../README.md)

## 개발 서버

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

## 빌드

```bash
pnpm build      # dist/ 출력
pnpm preview    # 빌드 결과 로컬 미리보기
```

## Vercel 서버리스 함수

`api/yf-proxy.ts` — Yahoo Finance 검색/차트 프록시.
Railway 서버 IP가 Yahoo Finance `query2`에 차단되어 Vercel IP를 통해 우회합니다.

- `?type=search&q={query}` → `query2.finance.yahoo.com/v1/finance/search`
- `?symbol={symbol}&range={range}&interval={interval}` → `query1.finance.yahoo.com/v8/finance/chart/{symbol}`

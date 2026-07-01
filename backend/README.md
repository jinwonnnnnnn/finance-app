# Backend — NestJS + Prisma + PostgreSQL

재테크 학습 앱 백엔드. 루트 README를 참고하세요: [../README.md](../README.md)

## 개발 서버

```bash
pnpm install
cp .env.example .env   # 환경변수 입력
npx prisma generate
npx prisma db push
pnpm seed              # 금융 용어 초기 데이터
pnpm start:dev         # http://localhost:4000
```

## 모듈 구조

| 모듈 | 경로 | 역할 |
|------|------|------|
| auth | `src/auth/` | JWT + Google / Kakao OAuth |
| users | `src/users/` | 사용자 프로필 + 설문 결과 |
| stock | `src/stock/` | US(Finnhub) + KR(Yahoo Finance) 시세/차트/검색 |
| watchlist | `src/watchlist/` | 관심종목 CRUD |
| glossary | `src/glossary/` | 금융 용어 DB |
| ai | `src/ai/` | Groq AI 투자 분석 · 뉴스 요약 |
| news | `src/news/` | Finnhub 뉴스 |

## 주요 환경변수

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
GROQ_API_KEY=
FINNHUB_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
CLIENT_URL=
VERCEL_PROXY=   # KR 검색 프록시 URL (기본값: finance-app-jw.vercel.app/api/yf-proxy)
```

## DB 관리

```bash
npx prisma studio   # http://localhost:5555 GUI
npx prisma db push  # 스키마 변경 반영
```

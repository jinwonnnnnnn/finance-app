# 핀테크입문 — 재테크 학습 앱

> 초보자를 위한 AI 기반 재테크 입문 플랫폼.
> 실시간 주식 시세 · 차트 · 검색 자동완성 · AI 투자 분석 · 금융 용어 사전을 한 곳에서.

**Live:** https://finance-app-jw.vercel.app

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **온보딩 설문** | 5단계 슬라이드로 투자 성향 파악 |
| **미국 주식 (US)** | Finnhub API — 실시간 시세 + 차트 + 종목 검색 |
| **국내 주식 (KR)** | Yahoo Finance — 실시간 시세 + 차트 + 종목 검색 (Vercel 프록시 경유) |
| **검색 자동완성** | 300ms 디바운스 드롭다운, 키보드 방향키 + Enter 선택 |
| **AI 투자 분석** | Groq AI (llama-3.3-70b) — 뉴스 요약 · 종목 분석 · ETF 추천 |
| **금융 용어 사전** | 용어 해설 + AI Q&A |
| **관심종목 관리** | 즐겨찾기 추가 · 대시보드 모니터링 |
| **소셜 로그인** | Google OAuth · 카카오 OAuth |

---

## 기술 스택

### Frontend

| 기술 | 역할 |
|------|------|
| React 18 + Vite + TypeScript | SPA 프레임워크 |
| Tailwind CSS v4 | 다크 테마 유틸리티 스타일링 |
| Framer Motion | 페이지 전환 · 드롭다운 · 온보딩 애니메이션 |
| Recharts | 주식 Area Chart |
| TanStack Query | 서버 상태 캐싱 + 30초 자동 refetch |
| Zustand + persist | 전역 인증 상태 관리 |
| React Router v6 | SPA 라우팅 + URL 파라미터 상태 |
| Axios | JWT 자동 갱신 인터셉터 |

### Backend

| 기술 | 역할 |
|------|------|
| NestJS + TypeScript | 모듈형 REST API 서버 |
| Prisma 7 + @prisma/adapter-pg | ORM |
| PostgreSQL (Railway) | 클라우드 DB |
| JWT + Refresh Token | 인증 / 토큰 갱신 |
| Passport.js | Google OAuth / 카카오 OAuth |
| Groq SDK (llama-3.3-70b-versatile) | AI 투자 분석 · 뉴스 요약 · 용어 설명 |
| Finnhub API | 미국 주식 시세 · 검색 · 뉴스 |
| Yahoo Finance HTTP API | 국내 주식 시세 · 차트 · 검색 (axios 직접 호출) |

### 인프라

| 기술 | 역할 |
|------|------|
| Railway | 백엔드 서버 (Dockerfile 자동 배포) |
| Vercel | 프론트엔드 + `/api/yf-proxy` 서버리스 함수 |
| GitHub Actions | CI / QA / Loop Engineering 자동화 |
| Claude Code | Loop Engineering 오케스트레이터 |

---

## 아키텍처

```
사용자 (브라우저)
    │
    ▼
Vercel  (finance-app-jw.vercel.app)
    │
    ├── /api/yf-proxy  ──────────────────────→  Yahoo Finance (search)
    │   Vercel 서버리스 함수                     query2.finance.yahoo.com
    │   (Railway IP 차단 우회)
    │
    └── /api/*  ─────────────────────────────→  Railway Backend
                                                precious-gentleness-production.up.railway.app
                                                    │
                                                    ├── PostgreSQL (Railway)
                                                    ├── Finnhub API       ← US 주식 시세/검색
                                                    ├── Yahoo Finance     ← KR 차트/시세
                                                    │   (range 파라미터, crumb 불필요)
                                                    └── Groq AI API       ← 투자 분석/요약
```

### KR 주식 데이터 흐름 상세

Railway 서버 IP가 Yahoo Finance `query2` 서버에 ETIMEDOUT 차단되는 문제를 Vercel 서버리스 함수로 우회합니다.

```
[검색]  Browser → Railway → Vercel /api/yf-proxy → query2.finance.yahoo.com/v1/finance/search
[차트]  Browser → Railway → query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1mo
         ↑ range 파라미터 방식은 crumb 인증 불필요, Railway IP에서 직접 통과
[시세]  chart API meta 필드에서 regularMarketPrice 추출 (별도 quote 엔드포인트 없음)
```

---

## 주식 API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/stock/search?q={query}&market=US` | 미국 종목 검색 (Finnhub) |
| `GET /api/stock/search?q={query}&market=KR` | 국내 종목 검색 (Yahoo Finance via Vercel proxy) |
| `GET /api/stock/{symbol}/quote?market=US` | 미국 현재가 |
| `GET /api/stock/{symbol}/quote?market=KR` | 국내 현재가 |
| `GET /api/stock/{symbol}/candles?resolution=D&from=&to=&market=` | 차트 데이터 |

차트 기간 → Yahoo Finance `range` 매핑:

| 기간 | range | interval |
|------|-------|----------|
| 1일  | `1d`  | `5m`     |
| 1주  | `5d`  | `30m`    |
| 1달  | `1mo` | `1d`     |
| 3달  | `3mo` | `1d`     |
| 1년  | `1y`  | `1wk`    |

---

## Loop Engineering

GitHub Issues → AI 자동 구현 → PR → CI/QA → 자동 배포의 완전 자동화 루프.

```
1. TARGET  →  GitHub Issues에 기능/버그 이슈 등록
2. TRIGGER →  이슈에 'claude' 또는 'grok' 라벨 부착
3. ACTION  →  AI가 코드 수정 + PR 자동 생성
4. VERIFY  →  CI (TypeScript + Build) + QA 자동 실행
               실패 시 → @claude 멘션 → 자동 재수정
               통과 시 → Vercel 자동 배포
5. RECORD  →  이슈에 작업 시작/완료 댓글 자동 기록
```

### 워크플로우 파일

| 파일 | 역할 | 트리거 |
|------|------|--------|
| `.github/workflows/ci.yml` | TypeScript 타입체크 + 빌드 검증 | PR / push |
| `.github/workflows/claude-qa.yml` | QA 리뷰 + CI 통과 후 자동 배포 | CI 성공 |
| `.github/workflows/ai-issue.yml` | Groq AI 이슈 자동 구현 → PR 생성 | 'grok' 라벨 |
| `.github/workflows/claude-ci-retry.yml` | CI 실패 시 @claude 자동 재시도 | CI 실패 |
| `.github/workflows/vercel-deploy.yml` | Vercel 프론트엔드 배포 | main 브랜치 push |

### 사용 방법

```bash
# 방법 1: claude 라벨 (Claude Code 기반 구현)
이슈 생성 → 'claude' 라벨 부착
→ Claude Code가 이슈 분석 + 코드 수정 + PR 생성
→ CI + QA 자동 실행 → Vercel 자동 배포

# 방법 2: grok 라벨 (Groq AI 기반 구현)
이슈 생성 → 'grok' 라벨 부착
→ Groq AI(llama-3.3-70b)가 코드 분석 + PR 생성

# 방법 3: 멘션 트리거
이슈 댓글에 '@claude 수정해줘' 또는 '@grok 구현해줘' 입력
```

### 필요한 GitHub Secrets

| Secret | 용도 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude Code Loop Engineering |
| `GROQ_API_KEY` | Groq AI 이슈 구현 |
| `VERCEL_TOKEN` | Vercel 자동 배포 |
| `VERCEL_ORG_ID` | Vercel 자동 배포 |
| `VERCEL_PROJECT_ID` | Vercel 자동 배포 |

---

## 로컬 실행

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- PostgreSQL (또는 Railway 클라우드 DB URL)

### 백엔드

```bash
cd backend
pnpm install
cp .env.example .env   # .env 파일 값 입력
npx prisma generate
npx prisma db push
pnpm seed              # 금융 용어 초기 데이터
pnpm start:dev         # http://localhost:4000
```

### 프론트엔드

```bash
cd frontend
pnpm install
pnpm dev               # http://localhost:5173
```

### 환경변수

```env
# backend/.env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
GROQ_API_KEY="gsk_..."
FINNHUB_TOKEN="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:4000/api/auth/google/callback"
KAKAO_CLIENT_ID="..."
KAKAO_CLIENT_SECRET="..."
CLIENT_URL="http://localhost:5173"
PORT=4000

# 선택: KR 주식 검색 프록시 (미설정 시 기본값 사용)
VERCEL_PROXY="https://finance-app-jw.vercel.app/api/yf-proxy"
```

---

## 프로젝트 구조

```
financialManagement/
├── frontend/                     # React + Vite
│   ├── api/
│   │   └── yf-proxy.ts           # Vercel 서버리스 함수 (Yahoo Finance 프록시)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/             # 로그인 / 회원가입
│   │   │   ├── onboarding/       # 투자 성향 설문
│   │   │   ├── home/             # 메인 대시보드
│   │   │   ├── stock/            # 주식 차트 (US / KR)
│   │   │   ├── news/             # 뉴스 탭
│   │   │   └── glossary/         # 용어 사전
│   │   ├── components/           # 재사용 컴포넌트
│   │   ├── stores/               # Zustand 상태
│   │   └── lib/                  # API 클라이언트 (Axios)
│   └── vercel.json               # Vercel 라우팅 + 프록시 설정
│
├── backend/                      # NestJS
│   ├── src/
│   │   ├── auth/                 # JWT + Google / Kakao OAuth
│   │   ├── users/                # 사용자 프로필 + 설문 결과
│   │   ├── stock/                # Finnhub(US) + Yahoo Finance(KR)
│   │   ├── watchlist/            # 관심종목
│   │   ├── glossary/             # 금융 용어
│   │   ├── ai/                   # Groq AI 투자 분석
│   │   └── news/                 # Finnhub 뉴스
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── Dockerfile                # Railway 배포용
│
├── .claude/                      # Claude Code 하네스
│   ├── agents/                   # 전문 에이전트 정의
│   └── skills/                   # 자동화 스킬
│
├── .github/
│   ├── workflows/                # CI / QA / 배포 워크플로우
│   └── scripts/                  # AI 이슈 처리 스크립트
│
└── CLAUDE.md                     # Claude Code 세션 가이드
```

---

## 배포 현황

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | https://finance-app-jw.vercel.app |
| 백엔드 API | https://precious-gentleness-production.up.railway.app |

```
git push origin main
    │
    ├── Railway: 백엔드 Dockerfile 빌드 + 자동 배포
    │
    └── GitHub Actions CI → QA → Vercel 프론트엔드 자동 배포
```

---

## 알려진 제약

- **KR 종목 검색**: Yahoo Finance는 한글 검색어를 지원하지 않습니다. 영문으로 입력하세요 (예: `samsung`, `sk`, `kakao`).
- **Finnhub 무료 플랜**: 분당 호출 제한이 있으며, 차트 데이터(캔들)는 Yahoo Finance로 대체합니다.
- **Yahoo Finance 비공식 API**: 공식 지원이 아니므로 차단 정책 변경 시 Vercel 프록시 엔드포인트를 업데이트해야 합니다.

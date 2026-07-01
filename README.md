# 핀테크입문 — 재테크 학습 앱

> 초보자를 위한 AI 기반 재테크 입문 플랫폼.  
> 실시간 주식 시세, AI 투자 제안, 금융 용어 해설을 한 곳에서.

---

## 주요 기능

- **온보딩 설문** — 투자 성향 파악 (5단계 슬라이드)
- **실시간 주식 차트** — 미국·국내 주식 실시간 시세 (Finnhub + Yahoo Finance)
- **AI 투자 분석** — Groq AI 기반 뉴스 요약, 종목 분석, 성향별 ETF 추천
- **금융 용어 사전** — 금융 용어 해설 + AI Q&A (Groq)
- **소셜 로그인** — Google OAuth / 카카오 OAuth
- **관심종목 관리** — 즐겨찾기 추가 및 대시보드 모니터링

---

## 기술 스택

### Frontend
| 기술 | 역할 |
|------|------|
| React 18 + Vite + TypeScript | SPA 프레임워크 |
| Tailwind CSS v4 | 유틸리티 기반 다크 테마 스타일링 |
| Framer Motion | 페이지 전환, 모달, 온보딩 애니메이션 |
| Recharts | 주식 Area Chart, 스파크라인 |
| TanStack Query | 서버 상태 캐싱 및 실시간 refetch |
| Zustand + persist | 전역 인증 상태 관리 |
| React Router v6 | SPA 라우팅 |
| Axios | JWT 자동 갱신 인터셉터 |

### Backend
| 기술 | 역할 |
|------|------|
| NestJS + TypeScript | 모듈형 REST API 서버 |
| Prisma 7 + @prisma/adapter-pg | ORM (드라이버 어댑터 패턴) |
| PostgreSQL (Railway) | 클라우드 DB |
| JWT + Refresh Token | 인증 / 토큰 갱신 |
| Passport.js | Google OAuth / Kakao OAuth 전략 |
| **Groq SDK (llama-3.3-70b-versatile)** | AI 투자 분석, 뉴스 요약, 용어 설명 |
| Finnhub API | 미국 주식 실시간 시세, 뉴스 |
| Yahoo Finance (yahoo-finance2) | 국내 주식 (KR) 실시간 시세 |

### 인프라 / DevOps
| 기술 | 역할 |
|------|------|
| Railway | 백엔드 서버 배포 (Dockerfile 기반) |
| Vercel | 프론트엔드 배포 + API 프록시 |
| GitHub Actions | CI / QA / Loop Engineering 자동화 |
| Claude Code | Loop Engineering 오케스트레이터 (이슈 → 코드 → PR → QA → 배포) |

---

## 아키텍처

```
사용자 (브라우저)
    │
    ▼
Vercel (finance-app-jw.vercel.app)
    │  /api/* → 프록시
    ▼
Railway Backend (precious-gentleness-production.up.railway.app)
    │
    ├── PostgreSQL (Railway)
    ├── Finnhub API (미국 주식 실시간 시세)
    ├── Yahoo Finance (국내 주식 KR 시세)
    └── Groq AI API (투자 분석, 뉴스 요약, 용어 설명)
```

---

## Loop Engineering

이 프로젝트는 **GitHub Issues → AI 자동 구현 → PR → CI/QA 검증 → 자동 배포** 의 완전 자동화 루프로 개발됩니다.

### 5단계 흐름

```
┌─────────────────────────────────────────────────────────┐
│               Loop Engineering Flow                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. TARGET  ─→  GitHub Issues에 기능/버그 이슈 등록     │
│                                                         │
│  2. TRIGGER ─→  이슈에 'claude' 라벨 부착               │
│                 또는 이슈 댓글에 @claude 멘션            │
│                 또는 'grok' 라벨 / @grok 멘션            │
│                                                         │
│  3. ACTION  ─→  AI가 이슈 분석                          │
│                 → 코드 자동 수정                         │
│                 → PR 자동 생성                           │
│                                                         │
│  4. VERIFY  ─→  CI: TypeScript 타입 체크 + 빌드         │
│                 QA: 코드 품질/보안 자동 리뷰             │
│                 실패 시 → @claude 자동 멘션 → 재수정     │
│                 QA 통과 시 → Vercel 자동 배포            │
│                                                         │
│  5. RECORD  ─→  이슈에 작업 시작/완료 댓글 자동 기록    │
│                 워크플로우 로그 링크 첨부                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 워크플로우 파일

| 파일 | 역할 | 트리거 |
|------|------|--------|
| `.github/workflows/ci.yml` | TypeScript 타입체크 + 빌드 검증 | PR / push |
| `.github/workflows/claude-qa.yml` | QA 리뷰 + CI 통과 후 자동 배포 | CI 성공 |
| `.github/workflows/ai-issue.yml` | Groq AI 이슈 자동 구현 → PR 생성 | 'grok' 라벨 / @grok |
| `.github/workflows/claude-ci-retry.yml` | CI 실패 시 @claude 자동 재시도 | CI 실패 |
| `.github/workflows/vercel-deploy.yml` | Vercel 프론트엔드 배포 | main 브랜치 push |

### 사용 방법

```
# 방법 1: claude 라벨 (Claude Code 기반 구현)
1. GitHub Issues에서 새 이슈 생성
2. 이슈에 'claude' 라벨 부착
   → Claude Code가 자동으로 이슈 분석 후 코드 수정 + PR 생성
   → CI + QA 자동 실행
   → QA 통과 시 Vercel 자동 배포
   → 이슈에 작업 로그 댓글 자동 기록

# 방법 2: grok 라벨 (Groq AI 기반 구현)
1. 이슈에 'grok' 라벨 부착
   → Groq AI(llama-3.3-70b)가 코드 분석 후 수정 제안 + PR 생성

# 방법 3: 수동 트리거
이슈 댓글에 '@claude 수정해줘' 또는 '@grok 구현해줘' 입력
```

### 필요한 GitHub Secrets

| Secret | 설명 | 용도 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 | Claude Code Loop Engineering |
| `GROQ_API_KEY` | Groq API 키 | Groq AI 이슈 구현 |
| `VERCEL_TOKEN` | Vercel 배포 토큰 | 자동 배포 |
| `VERCEL_ORG_ID` | Vercel 조직 ID | 자동 배포 |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | 자동 배포 |

---

## 로컬 실행 방법

### 사전 요구사항

- Node.js 22+ (Yahoo Finance yahoo-finance2 v3 요구사항)
- pnpm 9+
- PostgreSQL (또는 Railway 클라우드 DB)

### 백엔드 실행

```bash
cd backend

# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 값 입력 (아래 환경변수 섹션 참고)

# Prisma 클라이언트 생성
npx prisma generate

# DB 마이그레이션
npx prisma db push

# 초기 데이터 시딩 (금융 용어 20개)
pnpm seed

# 개발 서버 실행 (http://localhost:4000)
pnpm start:dev
```

### 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
pnpm install

# 개발 서버 실행 (http://localhost:5173)
pnpm dev
```

### 환경변수 (.env)

```env
# 백엔드 (backend/.env)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# AI — Groq (in-app 투자 분석)
GROQ_API_KEY="gsk_..."

# 주식 데이터
FINNHUB_TOKEN="your-finnhub-token"

# 소셜 로그인
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/auth/google/callback"
KAKAO_CLIENT_ID="your-kakao-client-id"
KAKAO_CLIENT_SECRET="your-kakao-client-secret"

CLIENT_URL="http://localhost:5173"
PORT=4000
```

### DB 관리 (Prisma Studio)

```bash
cd backend
npx prisma studio
# http://localhost:5555 에서 GUI로 DB 확인
```

---

## 배포

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | https://finance-app-jw.vercel.app |
| 백엔드 API | https://precious-gentleness-production.up.railway.app |

### 배포 구조

```
GitHub main 브랜치 push
    │
    ├── CI 자동 실행 (TypeScript + Build 검증)
    │   └── 성공 시 → QA 자동 실행
    │               └── QA 통과 시 → Vercel 자동 배포
    │
    └── Railway: 백엔드 Dockerfile 빌드 + 배포 (자동)
```

---

## 프로젝트 구조

```
finance-app/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── pages/             # 라우트 페이지
│   │   │   ├── auth/          # 로그인/회원가입
│   │   │   ├── onboarding/    # 투자 성향 설문
│   │   │   ├── home/          # 메인 대시보드
│   │   │   ├── stock/         # 주식 차트 (US/KR)
│   │   │   ├── news/          # 뉴스 탭
│   │   │   └── glossary/      # 용어 사전
│   │   ├── components/        # 재사용 컴포넌트
│   │   ├── stores/            # Zustand 상태
│   │   └── lib/               # API 클라이언트
│   └── vercel.json            # Vercel 배포 + 프록시 설정
│
├── backend/                   # NestJS
│   ├── src/
│   │   ├── auth/              # JWT + OAuth 인증
│   │   ├── users/             # 사용자 프로필
│   │   ├── stock/             # Finnhub(US) + Yahoo Finance(KR)
│   │   ├── watchlist/         # 관심종목
│   │   ├── glossary/          # 금융 용어
│   │   ├── ai/                # Groq AI 투자 분석
│   │   └── news/              # 뉴스 요약
│   ├── prisma/
│   │   ├── schema.prisma      # DB 스키마
│   │   └── seed.ts            # 초기 데이터
│   └── Dockerfile             # Railway 배포용
│
├── .claude/                   # Claude Code 하네스
│   ├── agents/                # 전문 에이전트 정의
│   └── skills/                # 자동화 스킬
│
├── .github/
│   ├── workflows/             # GitHub Actions (CI/QA/배포)
│   └── scripts/               # AI 이슈 처리 스크립트
└── CLAUDE.md                  # Claude Code 세션 가이드
```

---

## 이슈 / 기여

이슈 등록 시 제공된 템플릿을 사용해주세요.  
`claude` 라벨을 붙이면 Claude Code가, `grok` 라벨을 붙이면 Groq AI가 자동으로 구현합니다.

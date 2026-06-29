# 핀테크입문 — 재테크 학습 앱

> 초보자를 위한 AI 기반 재테크 입문 플랫폼.  
> 실시간 주식 시세, AI 투자 제안, 금융 용어 해설을 한 곳에서.

---

## 주요 기능

- **온보딩 설문** — 투자 성향 파악 (5단계 슬라이드)
- **실시간 주식/코인 차트** — 미국·국내 주식 실시간 시세 (Finnhub API)
- **AI 투자 제안** — 시장 뉴스 + 사용자 관심사 기반 Claude AI 분석
- **금융 용어 사전** — 금융감독원 기준 용어 해설 + AI Q&A
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
| PostgreSQL (Neon) | 클라우드 DB |
| JWT + Refresh Token | 인증 / 토큰 갱신 |
| Passport.js | Google OAuth / Kakao OAuth 전략 |
| Claude API (claude-sonnet-4-6) | AI 투자 제안, 용어 설명 |
| Finnhub API | 실시간 주식 시세, 뉴스 |

### 인프라 / DevOps
| 기술 | 역할 |
|------|------|
| Railway | 백엔드 서버 배포 (Dockerfile 기반) |
| Vercel | 프론트엔드 배포 + API 프록시 |
| GitHub Actions | CI / QA / Loop Engineering 자동화 |
| Docker | 백엔드 컨테이너 빌드 |

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
    ├── PostgreSQL (Neon)
    ├── Finnhub API (실시간 시세)
    └── Claude API (AI 분석)
```

---

## Loop Engineering

이 프로젝트는 **GitHub Issues → Claude AI 자동 구현 → PR → CI/QA 검증** 의 완전 자동화 루프로 개발됩니다.

### 5단계 흐름

```
┌─────────────────────────────────────────────────────────┐
│                  Loop Engineering Flow                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. TARGET  ─→  GitHub Issues                          │
│                                                         │
│  2. TRIGGER ─→  이슈에 'claude' 라벨 부착              │
│                 또는 이슈 댓글에 @claude 멘션           │
│                                                         │
│  3. ACTION  ─→  Claude Code가 이슈 분석                │
│                 → 코드 자동 수정                        │
│                 → PR 자동 생성                          │
│                                                         │
│  4. VERIFY  ─→  CI: TypeScript 타입 체크 + 빌드        │
│                 QA: Claude가 코드 품질/보안 리뷰        │
│                 실패 시 → @claude 자동 멘션 → 재수정    │
│                                                         │
│  5. RECORD  ─→  이슈에 작업 시작/완료 댓글 자동 기록   │
│                 워크플로우 로그 링크 첨부               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 워크플로우 파일

| 파일 | 역할 |
|------|------|
| `.github/workflows/claude-issue.yml` | 이슈 감지 → Claude 구현 → PR 생성 + 기록 |
| `.github/workflows/ci.yml` | PR 빌드 검증 (TypeScript + Build) |
| `.github/workflows/claude-qa.yml` | Claude QA 에이전트 (코드 품질/보안 리뷰) |
| `.github/workflows/claude-ci-retry.yml` | CI 실패 시 @claude 자동 재시도 |

### 사용 방법

```
1. GitHub Issues에서 새 이슈 생성
2. 이슈에 'claude' 라벨 부착
   → Claude가 자동으로 이슈 분석 후 PR 생성
   → CI + QA 자동 실행
   → 이슈에 작업 로그 댓글 자동 기록

또는: 이슈 댓글에 '@claude 수정해줘' 입력
```

### 필요한 GitHub Secrets

| Secret | 설명 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude API 키 (Actions 실행에 필요) |

---

## 로컬 실행 방법

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- PostgreSQL (또는 Neon 클라우드 DB)

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
ANTHROPIC_API_KEY="sk-ant-..."
FINNHUB_TOKEN="your-finnhub-token"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/auth/google/callback"
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
    ├── Vercel: 프론트엔드 자동 배포
    └── Railway: 백엔드 Dockerfile 빌드 + 배포
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
│   │   │   ├── dashboard/     # 메인 대시보드
│   │   │   ├── stock/         # 주식 차트
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
│   │   ├── stock/             # Finnhub 주식 시세
│   │   ├── watchlist/         # 관심종목
│   │   ├── glossary/          # 금융 용어
│   │   ├── ai/                # Claude AI 투자 제안
│   │   └── prisma/            # DB 서비스
│   ├── prisma/
│   │   ├── schema.prisma      # DB 스키마
│   │   └── seed.ts            # 초기 데이터
│   └── Dockerfile             # Railway 배포용
│
├── .github/
│   ├── workflows/             # GitHub Actions
│   └── ISSUE_TEMPLATE/        # 이슈 템플릿
└── railway.json               # Railway 배포 설정
```

---

## 이슈 / 기여

이슈 등록 시 제공된 템플릿을 사용해주세요.  
`claude` 라벨을 붙이면 AI가 자동으로 구현합니다.

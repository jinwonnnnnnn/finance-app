# 핀테크입문 — 재테크 학습 앱

> 초보자를 위한 AI 기반 재테크 입문 플랫폼.
> 실시간 주식 시세 · 차트 · AI 투자 분석 · 금융 용어 사전을 한 곳에서.

**Live:** https://finance-app-jw.vercel.app

---

## 하네스 (Harness) — 에이전트 팀 자동화 시스템

이 프로젝트는 Claude Code 기반 **하네스(Harness)** 위에서 개발됩니다.
개발 요청이 들어오면 오케스트레이터가 전문 에이전트를 조합해 분석 → 구현 → 배포까지 자동으로 처리합니다.

### 에이전트 구성

```
사용자 요청
    │
    ▼
┌─────────────────────────────────────────────┐
│               orchestrator                   │
│  요청 유형 분류 → 적합한 에이전트 선택 → 결과 종합  │
└────────────┬──────────────────────────────┘
             │
    ┌────────┼─────────────────────────────────┐
    ▼        ▼             ▼                   ▼
stock-    feature-      ai-analyst         deployer
monitor   builder
    │        │               │                 │
    ▼        ▼               ▼                 ▼
API 상태   기능 구현       AI 분석           Vercel +
진단/수정  (React+NestJS)  (Groq AI)         Railway
                                             배포
              │               │
              └───────────────┘
              복합 기능 시 팀 구성
              (feature-builder ↔ ai-analyst)

    ▼
design-engineer  ← UI/UX 개선 전담

    ▼  2-phase QA 파이프라인
qa-engineer  →  verifier
(진단·리포트)   (독립 재확인·trust_score)
```

### 에이전트별 역할

| 에이전트 | 역할 | 담당 도메인 |
|--------|------|-----------|
| **orchestrator** | 요청 유형 분류 → 에이전트 선택 → 결과 종합. 직접 코드를 작성하지 않는다 | 조율 전용 |
| **stock-monitor** | Finnhub(US) · Yahoo Finance(KR) API 상태 점검. 가격 0원·null·403 원인 진단 후 수정 방향 제시 | 데이터 품질 |
| **feature-builder** | React(프론트) + NestJS(백엔드) 전반의 기능 확장 구현. 포트폴리오, 알림, 차트 지표 등 | 기능 개발 |
| **ai-analyst** | Groq AI(llama-3.3-70b) 기반 뉴스 요약·종목 분석·ETF 추천·용어 설명 기능 설계 및 구현 | AI 분석 |
| **deployer** | 빌드 검증(`tsc --noEmit`) → 환경변수 점검 → Vercel/Railway 배포 → 헬스체크 순서 준수 | 배포 자동화 |
| **design-engineer** | Robinhood/Toss/Coinbase 디자인 패턴 참고해 React + Tailwind 컴포넌트 개선 | UI/UX |
| **qa-engineer** | 배포 후 API curl 체크 + 구조화 JSON 리포트 출력. **read-only** — 코드 수정/push 불가, GET 요청만 허용 | QA |
| **verifier** | QA 리포트를 독립적으로 재실행해 trust_score 산출. 교차검증으로 QA 오진 방지 | QA 검증 |
| **sentry-monitor** | Sentry API로 프로덕션 에러 조회 · 스택트레이스 분석 · fix 에이전트 라우팅 | 에러 모니터링 |

### 오케스트레이터 라우팅 기준

| 요청 키워드 | 담당 에이전트 | 실행 모드 |
|-----------|------------|---------|
| "API 오류", "0원", "차트 안 나와", "ETIMEDOUT" | stock-monitor | 서브 에이전트 |
| "기능 추가", "포트폴리오", "알림", "새 지표" | feature-builder | 서브 에이전트 |
| "AI 분석", "Groq", "뉴스 요약", "ETF 추천" | ai-analyst | 서브 에이전트 |
| "배포", "Vercel", "Railway", "빌드 오류" | deployer | 서브 에이전트 |
| 복합 요청 (기능 + AI) | feature-builder + ai-analyst | 에이전트 팀 |
| 전체 파이프라인 | 전체 팀 | 에이전트 팀 |

### 에이전트 협업 흐름 예시

**새 AI 기능 추가 요청:**
```
1. orchestrator가 복합 요청으로 분류
2. ai-analyst → Groq 프롬프트 설계 + API 엔드포인트 스펙 작성
3. feature-builder → ai-analyst 산출물 받아 React UI + NestJS 연동 구현
4. qa-engineer → 구현된 기능 API 검증 (구조화 JSON 리포트, read-only)
5. verifier → QA 리포트 독립 재확인 (trust_score ≥ 0.8 시 채택)
6. deployer → 검증 통과 후 Vercel/Railway 배포
7. orchestrator → 전체 결과 종합 보고
```

**데이터 이상 감지 요청:**
```
1. orchestrator가 단일 도메인으로 분류
2. stock-monitor → stock.service.ts 코드 분석 + Railway 로그 패턴 진단
3. stock-monitor → 원인(파일:라인) + 수정 방향 제시
4. (필요 시) feature-builder에게 수정 위임
5. deployer → 수정 후 배포
```

---

## Loop Engineering — GitHub Actions 자동화

GitHub Issues에 라벨을 붙이면 AI가 코드를 수정하고 PR을 만들어 자동 배포까지 처리합니다.

```
┌──────────────────────────────────────────────────────────┐
│                  Loop Engineering Flow                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. TARGET  →  GitHub Issues에 기능/버그 이슈 등록        │
│                                                          │
│  2. TRIGGER →  이슈에 'claude' 또는 'grok' 라벨 부착      │
│                또는 이슈 댓글에 @claude / @grok 멘션       │
│                                                          │
│  3. ACTION  →  AI가 코드베이스 분석                       │
│                → 코드 자동 수정                           │
│                → PR 자동 생성                            │
│                                                          │
│  4. VERIFY  →  CI: TypeScript 타입체크 + 빌드             │
│                QA: 코드 품질/보안 자동 리뷰               │
│                실패 시 → @claude 자동 멘션 → 재수정        │
│                통과 시 → Vercel 자동 배포                 │
│                                                          │
│  5. RECORD  →  이슈에 작업 시작/완료 댓글 자동 기록        │
│                워크플로우 로그 링크 첨부                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 워크플로우 파일

| 파일 | 역할 | 트리거 |
|------|------|--------|
| `ci.yml` | TypeScript 타입체크 + 빌드 검증 | PR / main push |
| `vercel-deploy.yml` | Vercel 프론트엔드 자동 배포 | main push |
| `ai-issue.yml` | Groq AI(llama-3.3-70b) 이슈 분석 → 코드 수정 → PR 생성 | 'grok' 라벨 / @grok 멘션 |
| `claude-ci-retry.yml` | CI 실패 시 @claude 자동 재시도 호출 | CI 실패 이벤트 |

### 사용 방법

```bash
# 방법 1 — claude 라벨 (Claude Code 기반 구현)
GitHub Issues → 새 이슈 생성 → 'claude' 라벨 부착
→ Claude Code가 이슈 분석 + 코드 수정 + PR 자동 생성
→ CI + QA 자동 실행 → 통과 시 Vercel 자동 배포

# 방법 2 — grok 라벨 (Groq AI 기반 구현)
이슈에 'grok' 라벨 부착
→ Groq AI(llama-3.3-70b)가 코드 분석 + PR 자동 생성

# 방법 3 — 멘션 트리거 (이슈 댓글)
이슈 댓글에 "@claude 이 버그 수정해줘" 또는 "@grok 이 기능 구현해줘" 입력
```

### 필요한 GitHub Secrets

| Secret | 용도 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude Code Loop Engineering |
| `GROQ_API_KEY` | Groq AI 이슈 자동 구현 |
| `VERCEL_TOKEN` | Vercel 자동 배포 |
| `VERCEL_ORG_ID` | Vercel 프로젝트 식별 |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 식별 |

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **온보딩 설문** | 5단계 슬라이드로 투자 성향 파악 |
| **미국 주식 (US)** | Finnhub API — 실시간 시세 + 차트 + 종목 검색 |
| **국내 주식 (KR)** | Yahoo Finance — 실시간 시세 + 차트 + 종목 검색 |
| **검색 자동완성** | 300ms 디바운스 드롭다운, 키보드 방향키 + Enter 선택 |
| **AI 투자 분석** | Groq AI(llama-3.3-70b) — 뉴스 요약 · 종목 분석 · ETF 추천 |
| **금융 용어 사전** | 용어 해설 + AI Q&A |
| **관심종목 관리** | 즐겨찾기 추가 · 대시보드 모니터링 |
| **소셜 로그인** | Google OAuth · 카카오 OAuth |

---

## 기술 스택

### Frontend

| 기술 | 역할 |
|------|------|
| React 18 + Vite + TypeScript | SPA 프레임워크 |
| Tailwind CSS v4 | 다크 테마 스타일링 |
| Framer Motion | 페이지 전환 · 드롭다운 · 온보딩 애니메이션 |
| Recharts | 주식 Area Chart |
| TanStack Query | 서버 상태 캐싱 + 30초 자동 refetch |
| Zustand + persist | 전역 인증 상태 |
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
| Yahoo Finance HTTP API | 국내 주식 시세 · 차트 · 검색 |

### 인프라

| 기술 | 역할 |
|------|------|
| Railway | 백엔드 서버 (Dockerfile 자동 배포) |
| Vercel | 프론트엔드 + `/api/yf-proxy` 서버리스 함수 |
| GitHub Actions | CI / QA / Loop Engineering 자동화 |
| Claude Code | 하네스 오케스트레이터 (에이전트 팀 조율) |

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
    │   Railway IP 차단 우회
    │
    └── /api/*  ─────────────────────────────→  Railway Backend
                                                    │
                                                    ├── PostgreSQL
                                                    ├── Finnhub API       ← US 주식
                                                    ├── Yahoo Finance     ← KR 차트/시세
                                                    └── Groq AI API       ← AI 분석
```

**KR 주식 데이터 흐름:**
```
[검색]  Browser → Railway → Vercel /api/yf-proxy → query2.finance.yahoo.com/v1/finance/search
[차트]  Browser → Railway → query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1mo
         ↑ range 파라미터는 crumb 인증 불필요 — Railway IP에서 직접 통과
```

---

## 프로젝트 구조

```
financialManagement/
├── frontend/
│   ├── api/
│   │   └── yf-proxy.ts          # Vercel 서버리스 — Yahoo Finance 프록시
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/            # 로그인 / 회원가입
│   │   │   ├── onboarding/      # 투자 성향 설문
│   │   │   ├── home/            # 메인 대시보드
│   │   │   ├── stock/           # 주식 차트 (US / KR)
│   │   │   ├── news/            # 뉴스 탭
│   │   │   └── glossary/        # 용어 사전
│   │   ├── components/
│   │   ├── stores/              # Zustand
│   │   └── lib/                 # Axios 인스턴스
│   └── vercel.json
│
├── backend/
│   ├── src/
│   │   ├── auth/                # JWT + OAuth
│   │   ├── stock/               # Finnhub(US) + Yahoo Finance(KR)
│   │   ├── watchlist/
│   │   ├── glossary/
│   │   ├── ai/                  # Groq AI
│   │   └── news/
│   ├── prisma/
│   └── Dockerfile
│
├── .claude/
│   ├── agents/
│   │   ├── orchestrator.md      # 하네스 리더 — 요청 분류 + 에이전트 선택
│   │   ├── stock-monitor.md     # API 데이터 품질 진단
│   │   ├── feature-builder.md   # 기능 개발 (React + NestJS)
│   │   ├── ai-analyst.md        # Groq AI 기능 설계/구현
│   │   ├── deployer.md          # Vercel + Railway 배포
│   │   ├── design-engineer.md   # UI/UX 개선
│   │   ├── qa-engineer.md       # 배포 후 API QA (read-only, 구조화 리포트)
│   │   ├── verifier.md          # QA 리포트 독립 재검증 (trust_score 산출)
│   │   └── sentry-monitor.md    # Sentry 에러 조회 + 코드 연관 분석
│   └── skills/
│       ├── finance-orchestrate/ # 오케스트레이터 트리거 스킬
│       ├── auto-deploy/         # 배포 자동화 스킬
│       ├── stock-health-check/  # API 헬스체크 스킬
│       ├── feature-expand/      # 기능 확장 스킬
│       ├── ai-invest-analyze/   # AI 분석 스킬
│       └── bug-auto-fix/        # 버그 자동 수정 스킬
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # TypeScript + 빌드 검증
│   │   ├── vercel-deploy.yml    # Vercel 자동 배포
│   │   ├── ai-issue.yml         # Groq AI 이슈 자동 구현
│   │   └── claude-ci-retry.yml  # CI 실패 → @claude 자동 재시도
│   └── scripts/
│
└── CLAUDE.md                    # Claude Code 세션 가이드
```

---

## 로컬 실행

```bash
# 백엔드
cd backend
pnpm install
cp .env.example .env   # 환경변수 입력
npx prisma generate && npx prisma db push
pnpm seed              # 금융 용어 초기 데이터
pnpm start:dev         # http://localhost:4000

# 프론트엔드
cd frontend
pnpm install
pnpm dev               # http://localhost:5173
```

### 환경변수 (backend/.env)

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
GROQ_API_KEY=
FINNHUB_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
CLIENT_URL=http://localhost:5173
PORT=4000
VERCEL_PROXY=https://finance-app-jw.vercel.app/api/yf-proxy
SENTRY_DSN=                    # Sentry 프로젝트 DSN (백엔드용)
```

---

## 알려진 제약

- **KR 종목 검색**: Yahoo Finance는 한글 검색어를 지원하지 않습니다. 영문으로 검색하세요 (`samsung`, `sk`, `kakao`).
- **Finnhub 무료 플랜**: 분당 호출 제한이 있으며 차트 데이터는 Yahoo Finance로 대체합니다.
- **Yahoo Finance 비공식 API**: 공식 지원이 아니므로 차단 정책 변경 시 프록시 엔드포인트 업데이트가 필요할 수 있습니다.

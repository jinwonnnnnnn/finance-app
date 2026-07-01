---
name: auto-deploy
description: Vercel(프론트엔드)과 Railway(백엔드) 자동 배포 스킬. "배포해줘", "Vercel 배포", "Railway 배포", "빌드 오류", "프로덕션 배포", "배포 실패", "헬스체크" 등 배포 관련 요청 시 반드시 이 스킬을 사용할 것. CI/CD 설정, 배포 자동화, 배포 검증 요청에도 트리거.
---

# Vercel + Railway 자동 배포

코드 변경 후 안전하고 체계적으로 프론트(Vercel)와 백엔드(Railway)를 배포한다.

## 배포 사전 조건

타입 에러 또는 빌드 실패 시 배포를 진행하지 않는다.

```bash
# 1. 프론트엔드 타입체크
cd /Users/jinwon/Desktop/financialManagement/frontend
npx tsc --noEmit

# 2. 백엔드 빌드 검증
cd /Users/jinwon/Desktop/financialManagement/backend
npm run build
```

## 배포 순서

**백엔드 먼저 → 헬스체크 → 프론트엔드 순서를 반드시 지킨다.**
프론트가 먼저 배포되면 새 API를 찾지 못해 에러가 발생한다.

### 1. 백엔드 (Railway)

Railway는 Git push 시 자동 빌드된다:
```bash
cd /Users/jinwon/Desktop/financialManagement
git add backend/
git commit -m "feat: [변경 내용 요약]"
git push origin main
```

Railway 빌드 상태는 Railway 대시보드에서 확인한다.

### 2. 백엔드 헬스체크 (2분 대기 후)

```bash
curl https://precious-gentleness-production.up.railway.app/api/
# 200 응답 확인
```

### 3. 프론트엔드 (Vercel)

```bash
cd /Users/jinwon/Desktop/financialManagement/frontend
npx vercel --prod
```

배포 URL: `https://finance-app-jw.vercel.app`

### 4. 프론트 헬스체크

```bash
curl -I https://finance-app-jw.vercel.app
# HTTP 200 확인
```

## 환경변수 점검 체크리스트

### Vercel (프론트)
- [ ] `VITE_API_URL` = Railway 백엔드 URL

### Railway (백엔드)
- [ ] `DATABASE_URL` — PostgreSQL 연결 문자열
- [ ] `JWT_SECRET` — 랜덤 문자열
- [ ] `FINNHUB_TOKEN` — Finnhub API 키
- [ ] `GROQ_API_KEY` — Groq AI 키
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- [ ] `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET`
- [ ] `NODE_ENV` = `production`

## 롤백 방법

### Vercel 롤백
```bash
npx vercel ls  # 이전 배포 URL 확인
npx vercel promote [이전-배포-URL]
```

### Railway 롤백
Railway 대시보드 → Deployments → 이전 배포 → Rollback 버튼

## CI/CD 자동화 (GitHub Actions)

`.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: cd frontend && npm ci && npx tsc --noEmit
      - run: cd backend && npm ci && npm run build

  deploy-frontend:
    needs: type-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g vercel
      - run: cd frontend && vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

Railway는 GitHub main 브랜치 push 시 자동 배포된다.

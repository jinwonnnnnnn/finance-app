---
name: bug-auto-fix
description: 이슈 자동 진단 및 수정 스킬. "버그", "에러", "오류", "수정해줘", "고쳐줘", "안돼", "작동 안 해", "콘솔 에러", "500 에러", "TypeScript 에러" 등 문제 보고 시 반드시 이 스킬을 사용할 것. Groq 기반 에러 분석, 자동 수정 제안, 핫픽스 배포까지 처리.
---

# 이슈 자동 진단 및 수정

에러 증상 → 원인 분석 → 수정 코드 → (선택) 즉시 배포까지 자동화한다.

## 진단 프로세스

### 1. 증상 수집

사용자가 제공한 정보:
- 에러 메시지 (콘솔, Railway 로그)
- 발생 화면/기능
- 재현 조건

### 2. 에러 분류

| 에러 유형 | 확인 위치 | 빠른 원인 |
|---------|---------|---------|
| `TypeScript` 컴파일 에러 | 터미널 | 타입 불일치, 누락된 prop |
| `Network Error` / 빈 응답 | 브라우저 Network 탭 | API URL, CORS, 환경변수 |
| `403 Forbidden` | Railway 로그 | KR 주식 → Finnhub 라우팅 |
| `Prisma` 에러 | Railway 로그 | 마이그레이션 누락, 연결 실패 |
| `Cannot read undefined` | 브라우저 콘솔 | null 처리 누락 |
| 빈 화면 / 흰 화면 | 브라우저 콘솔 | React 렌더링 에러 |

### 3. 자주 발생하는 재테크 앱 버그

**KR 주식 0원 버그**:
```typescript
// 문제: market 파라미터 없이 호출
api.get(`/stock/${symbol}/quote`)

// 수정: market 추가
api.get(`/stock/${symbol}/quote`, { params: { market } })
```

**useEffect 훅 순서 버그**:
```typescript
// 문제: useQuery 이전에 useEffect 배치
useEffect(() => {
  if (!searchResults.length) return;  // searchResults 미정의!
}, [searchResults.length]);

const { data: searchResults } = useQuery(...)  // 이 아래에 있으면 에러

// 수정: 모든 useQuery 선언 후에 useEffect 배치
```

**Groq API 키 누락**:
```
GROQ_API_KEY not found → Groq() 초기화 실패
→ Railway 환경변수에 GROQ_API_KEY 추가 필요
```

### 4. 수정 적용

에러 원인 파악 후:
1. 해당 파일과 라인을 특정한다
2. 수정 코드를 제안한다
3. 사용자 승인 후 파일을 수정한다
4. 심각도에 따라 즉시 배포를 제안한다

## 자동 수정 판단 기준

| 심각도 | 기준 | 조치 |
|------|-----|-----|
| 즉시 수정 필요 | 화면이 완전히 깨짐, 데이터 0원 표시 | 수정 후 배포 제안 |
| 빠른 수정 | 일부 기능 오작동 | 수정, 다음 배포 시 포함 |
| 낮음 | 미관, 성능 개선 | 목록에 추가 |

## 출력 형식

```markdown
## 버그 진단 리포트

### 원인
파일: `경로/파일.ts:라인번호`
원인: 설명

### 수정 코드
\`\`\`typescript
// 수정 전
...
// 수정 후
...
\`\`\`

### 배포 필요 여부
[즉시 배포 필요 / 다음 배포 시 포함 / 배포 불필요]
```

---
name: finance-orchestrate
description: 재테크 앱(financialManagement) 하네스 오케스트레이터. 주식 데이터 이상, 기능 추가, AI 분석, 배포 요청 등 모든 재테크 앱 관련 개발 작업 요청 시 반드시 이 스킬을 사용할 것. "앱 개선", "기능 추가", "배포해줘", "주가 이상해", "AI 분석", "Groq", "Vercel", "Railway", "재테크" 등 키워드가 포함되면 이 스킬을 트리거. 재실행, 업데이트, 수정, 보완 요청도 이 스킬로 처리.
---

# 재테크 앱 하네스 오케스트레이터

재테크 입문자용 풀스택 앱(React + NestJS + Groq AI)의 모든 개발 작업을 조율한다.

## Phase 0: 컨텍스트 확인

실행 시작 전:
1. `.claude/_workspace/` 존재 여부 확인
   - 없음 → 초기 실행
   - 있음 + 부분 수정 요청 → 해당 에이전트만 재호출
   - 있음 + 새 요청 → `_workspace_prev/`로 이동 후 초기화

## Phase 1: 요청 분류

사용자 요청을 아래 기준으로 분류한다:

| 요청 키워드 | 담당 에이전트 | 실행 모드 |
|-----------|------------|---------|
| "데이터 이상", "0원", "403", "API 오류", "가격 안나와" | stock-monitor | 서브 에이전트 |
| "기능 추가", "포트폴리오", "알림", "차트", "지표" | feature-builder | 서브 에이전트 |
| "AI 분석", "Groq", "뉴스 요약", "추천", "용어 설명" | ai-analyst | 서브 에이전트 |
| "배포", "Vercel", "Railway", "빌드" | deployer | 서브 에이전트 |
| 복합 요청 | feature-builder + ai-analyst | 에이전트 팀 |
| 전체 파이프라인 | 전체 팀 | 에이전트 팀 |

## Phase 2: 에이전트 실행

**실행 모드: 하이브리드**

### 단일 도메인 (서브 에이전트 모드)

```
Agent(
  subagent_type: "general-purpose",
  model: "opus",
  prompt: "[agent-name].md 에이전트 정의를 읽고 역할을 수행하라. 요청: [사용자 요청]"
)
```

### 복합 도메인 (에이전트 팀 모드)

```
팀 구성:
- feature-builder: 기능 구현
- ai-analyst: AI 로직 설계
- (QA 필요 시) stock-monitor: 데이터 정합성 검증

TaskCreate로 의존성 명시:
- Task 1: ai-analyst → AI API 설계
- Task 2: feature-builder → 의존: Task 1 완료 후 UI 구현
- Task 3: deployer → 의존: Task 1, 2 완료 후 배포
```

## Phase 3: 결과 종합

모든 에이전트 완료 후:
1. 각 에이전트 결과를 하나의 리포트로 종합
2. 남은 작업 또는 후속 단계 제시
3. 필요 시 deployer 호출

## 에러 핸들링

- 에이전트 1회 실패 → 재시도
- 재실패 → 사용자에게 보고 + 수동 가이드 제공
- 데이터 불일치 → 출처 병기, 사용자 판단 위임

## 테스트 시나리오

**정상 흐름:**
요청 "삼성전자 가격이 0원으로 나와요" →
1. stock-monitor 호출 (KR 라우팅 점검)
2. 원인 진단 (market 파라미터 누락)
3. feature-builder 수정 위임
4. deployer 배포 실행
5. 종합 리포트 반환

**에러 흐름:**
배포 실패 → 헬스체크 실패 감지 → 롤백 가이드 + 에러 로그 분석 제안

## 참고 파일

- `references/project-context.md` — 프로젝트 전체 구조 및 스택 상세

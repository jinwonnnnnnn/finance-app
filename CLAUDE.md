# 재테크 앱 — Claude Code 가이드

## 프로젝트 개요

재테크 입문자를 위한 풀스택 주식/투자 학습 앱.
- **프론트**: React + TypeScript + Vite (Vercel 배포)
- **백엔드**: NestJS + Prisma + PostgreSQL (Railway 배포)
- **AI**: Groq SDK (llama-3.3-70b-versatile)
- **주식 데이터**: Finnhub (US) + Yahoo Finance (KR)

## 하네스: 재테크 앱 개발 자동화

**목표:** 주식 데이터 품질 모니터링, AI 분석 고도화, 기능 확장, 배포 자동화, UI/UX 디자인 고도화를 에이전트 팀으로 처리

**트리거:** 재테크 앱 관련 개발 작업 요청 시 `finance-orchestrate` 스킬을 사용하라. 단순 질문은 직접 응답 가능.

**QA 파이프라인 (2-phase):**
QA 요청 시 반드시 아래 순서를 따른다:
1. `qa-engineer` 실행 → 구조화 JSON 리포트 수신 (수정/push 절대 불가)
2. `verifier` 실행 (QA 결과 비공개로 독립 재확인) → trust_score 산출
3. trust_score ≥ 0.8 → 결과 채택 / < 0.8 → Claude Code가 직접 판단
4. 버그 수정은 항상 feature-builder 또는 Claude Code가 담당

**README 업데이트 규칙:**
에이전트 추가/수정/삭제, 스킬 추가, 아키텍처 변경 시 반드시 README.md의 해당 섹션도 함께 업데이트한다.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|---------|------|------|
| 2026-07-01 | 초기 하네스 구성 | 전체 | 재테크 앱 개발 자동화 체계 구축 |
| 2026-07-01 | qa-engineer 에이전트 추가 | agents/qa-engineer.md | 배포 후 브라우저+API 자동 QA 체계 구축 |
| 2026-07-06 | qa-engineer 역할 제한 + verifier 에이전트 추가 | agents/ | QA 범위 이탈·무단 push 방지, 2-phase 교차검증 체계 구축 |
| 2026-07-08 | Sentry 프론트+백엔드 연동 + sentry-monitor 에이전트 추가 | frontend/backend/agents/ | 프로덕션 에러 모니터링 체계 구축 |

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

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|---------|------|------|
| 2026-07-01 | 초기 하네스 구성 | 전체 | 재테크 앱 개발 자동화 체계 구축 |

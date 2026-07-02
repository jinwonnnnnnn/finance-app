import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const steps = [
  {
    id: 'age',
    question: '연령대를 선택해주세요',
    emoji: '👤',
    options: ['20대', '30대', '40대', '50대 이상'],
  },
  {
    id: 'experience',
    question: '투자 경험이 있으신가요?',
    emoji: '📊',
    options: ['전혀 없음', '1년 미만', '1~3년', '3년 이상'],
  },
  {
    id: 'goal',
    question: '투자 목표는 무엇인가요?',
    emoji: '🎯',
    options: ['목돈 마련', '노후 준비', '월세 수입', '자산 증식'],
  },
  {
    id: 'risk',
    question: '손실이 나도 괜찮은 금액은?',
    emoji: '⚖️',
    options: ['원금 손실 절대 불가', '5% 이내', '10~20%', '20% 이상도 감수'],
  },
  {
    id: 'interests',
    question: '관심 있는 투자 분야를 모두 선택해주세요',
    emoji: '💡',
    multiple: true,
    options: [
      { label: '🇰🇷 국내주식', value: 'STOCK_KR' },
      { label: '🇺🇸 해외주식', value: 'STOCK_US' },
      { label: '₿ 암호화폐', value: 'COIN' },
      { label: '🏦 퇴직연금/IRP', value: 'PENSION' },
    ],
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const step = steps[current];
  const isLast = current === steps.length - 1;

  const selectOption = (value: string) => {
    if (step.multiple) {
      const prev = (answers[step.id] as string[]) ?? [];
      const next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
      setAnswers({ ...answers, [step.id]: next });
    } else {
      setAnswers({ ...answers, [step.id]: value });
      if (!isLast) {
        setDirection(1);
        setTimeout(() => setCurrent((c) => c + 1), 200);
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const interests = (answers.interests as string[]) ?? [];
      await api.patch('/users/survey', { surveyResult: answers, interests });
      if (user) setUser({ ...user, surveyDone: true, interests });
      navigate('/dashboard');
    } catch {
      setSubmitting(false);
    }
  };

  const isOptionSelected = (value: string) => {
    const ans = answers[step.id];
    if (Array.isArray(ans)) return ans.includes(value);
    return ans === value;
  };

  return (
    <div className="min-h-dvh bg-[#08090d] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">핀</span>
          </div>
          <span className="text-white font-semibold text-base">핀테크입문</span>
        </div>

        {/* 진행 바 */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= current ? 'bg-indigo-500' : 'bg-white/[0.07]'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 30 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mb-7">
              <p className="text-slate-600 text-xs mb-2">{current + 1} / {steps.length}</p>
              <div className="text-4xl mb-3">{step.emoji}</div>
              <h2 className="text-xl font-bold text-white">{step.question}</h2>
              {step.multiple && (
                <p className="text-slate-500 text-xs mt-1.5">복수 선택 가능</p>
              )}
            </div>

            <div className="space-y-2">
              {step.options.map((opt) => {
                const value = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                const selected = isOptionSelected(value);
                return (
                  <button
                    key={value}
                    onClick={() => selectOption(value)}
                    className={`w-full p-4 rounded-2xl text-left font-medium transition-all text-sm ${
                      selected
                        ? 'bg-indigo-600/15 border-2 border-indigo-500/70 text-white'
                        : 'bg-[#111318] border-2 border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{label}</span>
                      {selected && (
                        <svg className="w-4 h-4 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {step.multiple && (
              <button
                onClick={isLast ? handleSubmit : () => { setDirection(1); setCurrent((c) => c + 1); }}
                disabled={submitting || ((answers[step.id] as string[])?.length ?? 0) === 0}
                className="w-full mt-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl py-3.5 font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
              >
                {submitting ? '저장 중...' : isLast ? '투자 시작하기' : '다음 →'}
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {current > 0 && (
          <button
            onClick={() => { setDirection(-1); setCurrent((c) => c - 1); }}
            className="mt-4 text-slate-600 hover:text-slate-400 text-sm w-full text-center transition flex items-center justify-center gap-1"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            이전
          </button>
        )}
      </div>
    </div>
  );
}

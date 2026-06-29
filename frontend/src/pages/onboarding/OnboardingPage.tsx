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
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* 진행 바 */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= current ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 40 }}
            transition={{ duration: 0.25 }}
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{step.emoji}</div>
              <h2 className="text-2xl font-bold text-white">{step.question}</h2>
              {step.multiple && (
                <p className="text-slate-400 text-sm mt-2">복수 선택 가능</p>
              )}
            </div>

            <div className="grid gap-3">
              {step.options.map((opt) => {
                const value = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                const selected = isOptionSelected(value);
                return (
                  <button
                    key={value}
                    onClick={() => selectOption(value)}
                    className={`w-full p-4 rounded-xl text-left font-medium transition-all border-2 ${
                      selected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-[#1a1d27] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {step.multiple && (
              <button
                onClick={isLast ? handleSubmit : () => { setDirection(1); setCurrent((c) => c + 1); }}
                disabled={submitting || ((answers[step.id] as string[])?.length ?? 0) === 0}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl py-4 font-bold text-lg transition"
              >
                {submitting ? '저장 중...' : isLast ? '시작하기 🚀' : '다음'}
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {current > 0 && (
          <button
            onClick={() => { setDirection(-1); setCurrent((c) => c - 1); }}
            className="mt-4 text-slate-500 hover:text-slate-300 text-sm w-full text-center transition"
          >
            ← 이전
          </button>
        )}
      </div>
    </div>
  );
}

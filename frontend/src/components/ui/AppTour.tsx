import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_STEPS = [
  {
    emoji: '👋',
    title: '핀테크입문에 오신 걸 환영해요!',
    desc: '처음 재테크를 시작하는 분들을 위한 앱이에요. 함께 차근차근 알아볼게요.',
  },
  {
    emoji: '📊',
    title: '실시간 주식 시세',
    desc: '상단 탭에서 해외주식·국내주식·코인 시세를 실시간으로 확인할 수 있어요. 원하는 종목을 검색해서 차트도 볼 수 있어요.',
  },
  {
    emoji: '📖',
    title: '금융 용어가 어렵다면?',
    desc: '"용어사전" 탭에서 PER, ETF, IRP 같은 어려운 용어를 쉽게 배울 수 있어요. 탭하면 AI가 초등학생도 이해하게 설명해줘요.',
  },
  {
    emoji: '🤖',
    title: 'AI 투자 제안',
    desc: '홈 화면에서 세계 뉴스와 내 관심사를 분석해서 "지금 이런 투자는 어떠세요?" 카드를 보여줘요. 참고용으로만 활용하세요!',
  },
  {
    emoji: '⭐',
    title: '관심종목 등록',
    desc: '주식 화면에서 "관심종목" 버튼을 누르면 홈에서 바로 시세를 볼 수 있어요.',
  },
];

const TOUR_KEY = 'finance-app-tour-done';

export default function AppTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setShow(true), 800);
    }
  }, []);

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setShow(false);
  };

  const current = TOUR_STEPS[step];

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            onClick={finish}
          />

          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:max-w-sm z-50"
          >
            <div className="bg-[#1a1d27] border border-slate-700 rounded-3xl p-6 shadow-2xl">
              {/* 진행 점 */}
              <div className="flex gap-1.5 mb-5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? 'bg-indigo-500 w-6' : 'bg-slate-700 w-1.5'
                    }`}
                  />
                ))}
              </div>

              <div className="text-4xl mb-3">{current.emoji}</div>
              <h3 className="text-white font-bold text-lg mb-2">{current.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{current.desc}</p>

              <div className="flex gap-2">
                <button
                  onClick={finish}
                  className="flex-1 py-3 rounded-xl text-slate-500 hover:text-slate-300 text-sm transition border border-slate-800"
                >
                  건너뛰기
                </button>
                <button
                  onClick={next}
                  className="flex-2 flex-grow py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
                >
                  {step === TOUR_STEPS.length - 1 ? '시작하기 🚀' : '다음 →'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

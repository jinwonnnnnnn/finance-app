import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface GlossaryItem {
  term: string;
  simple: string;
  detail: string;
  example?: string;
  category: string;
  source: string;
}

interface Props {
  item: GlossaryItem | null;
  onClose: () => void;
}

export default function GlossaryModal({ item, onClose }: Props) {
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');

  const aiMutation = useMutation({
    mutationFn: ({ term, context }: { term: string; context?: string }) =>
      api.post('/ai/explain', { term, context }).then((r) => r.data),
    onSuccess: (data) => setAiAnswer(data.explanation),
  });

  const askAI = (q?: string) => {
    if (!item) return;
    const ctx = q ?? question;
    aiMutation.mutate({ term: item.term, context: ctx || undefined });
    if (q) setQuestion(q);
  };

  const QUICK_QUESTIONS = [
    '초보자에게 어떻게 설명하나요?',
    '실제 투자에서 어떻게 쓰나요?',
    '주의할 점은?',
  ];

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1117] border-t border-white/[0.07] rounded-t-3xl max-h-[88dvh] overflow-y-auto overscroll-contain"
          >
            {/* 드래그 핸들 */}
            <div className="sticky top-0 bg-[#0f1117] pt-3 pb-1 flex flex-col items-center border-b border-white/[0.04] z-10">
              <div className="w-9 h-1 bg-white/10 rounded-full mb-3" />
            </div>

            <div className="p-5 pb-8 pb-safe">
              {/* 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{item.term}</h2>
                  <span className="text-[11px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded-full px-2.5 py-0.5 mt-1.5 inline-block font-medium">
                    {item.category}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-400 hover:text-white transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 한 줄 요약 */}
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 mb-4">
                <p className="text-indigo-200 font-medium text-[15px] leading-relaxed">{item.simple}</p>
              </div>

              {/* 상세 설명 */}
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{item.detail}</p>

              {/* 예시 */}
              {item.example && (
                <div className="flex gap-3 mb-4">
                  <div className="w-0.5 bg-emerald-500/40 rounded-full shrink-0 my-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">예시</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{item.example}</p>
                  </div>
                </div>
              )}

              <p className="text-slate-700 text-[11px] mb-5">출처: {item.source}</p>

              {/* AI 질문 구역 */}
              <div className="border-t border-white/[0.05] pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 7.5h-9v9h9v-9z" />
                      <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-white">AI에게 더 물어보기</p>
                </div>

                {!aiAnswer && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => askAI(q)}
                        disabled={aiMutation.isPending}
                        className="text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-slate-300 rounded-xl px-3 py-2 transition disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && askAI()}
                    onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: 'center' }), 250)}
                    placeholder={`"${item.term}"에 대해 궁금한 점...`}
                    className="flex-1 min-w-0 bg-[#111318] border border-white/[0.07] rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                  />
                  <button
                    onClick={() => askAI()}
                    disabled={aiMutation.isPending || !question}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-3 rounded-2xl text-sm font-semibold transition"
                  >
                    {aiMutation.isPending ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M12 3v3M12 18v3M5.636 5.636l2.122 2.122M16.243 16.243l2.121 2.121M3 12h3M18 12h3M5.636 18.364l2.122-2.122M16.243 7.757l2.121-2.121" />
                      </svg>
                    ) : '질문'}
                  </button>
                </div>

                <AnimatePresence>
                  {aiAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4"
                    >
                      <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{aiAnswer}</p>
                      <button
                        onClick={() => { setAiAnswer(''); setQuestion(''); }}
                        className="text-xs text-slate-600 hover:text-slate-400 mt-3 transition flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        다시 질문하기
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

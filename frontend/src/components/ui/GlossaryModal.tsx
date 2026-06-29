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

  const QUICK_QUESTIONS = ['초보자에게 어떻게 설명하나요?', '실제 투자에서 어떻게 쓰나요?', '주의할 점은?'];

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* 배경 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* 모달 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1d27] rounded-t-3xl border-t border-slate-700 max-h-[85vh] overflow-y-auto"
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-600 rounded-full" />
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{item.term}</h2>
                  <span className="text-xs bg-indigo-600/20 text-indigo-300 rounded px-2 py-0.5 mt-1 inline-block">{item.category}</span>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition text-2xl leading-none">×</button>
              </div>

              {/* 한 줄 요약 */}
              <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-xl p-4 mb-4">
                <p className="text-indigo-200 font-medium">{item.simple}</p>
              </div>

              {/* 상세 설명 */}
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{item.detail}</p>

              {/* 예시 */}
              {item.example && (
                <div className="bg-slate-800/60 rounded-xl p-4 mb-4">
                  <p className="text-xs text-slate-500 mb-1">📌 예시</p>
                  <p className="text-slate-300 text-sm">{item.example}</p>
                </div>
              )}

              <p className="text-slate-600 text-xs mb-6">출처: {item.source}</p>

              {/* AI 질문 */}
              <div className="border-t border-slate-800 pt-4">
                <p className="text-sm font-semibold text-white mb-3">🤖 AI에게 더 물어보기</p>

                {/* 빠른 질문 버튼 */}
                {!aiAnswer && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => askAI(q)}
                        disabled={aiMutation.isPending}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3 py-2 transition disabled:opacity-50"
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
                    placeholder={`"${item.term}" 에 대해 더 궁금한 점...`}
                    className="flex-1 bg-[#0f1117] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => askAI()}
                    disabled={aiMutation.isPending || !question}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    {aiMutation.isPending ? '...' : '질문'}
                  </button>
                </div>

                {aiAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-indigo-900/20 border border-indigo-800/40 rounded-xl p-4"
                  >
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{aiAnswer}</p>
                    <button
                      onClick={() => { setAiAnswer(''); setQuestion(''); }}
                      className="text-xs text-slate-500 hover:text-slate-300 mt-3 transition"
                    >
                      다시 질문하기
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="h-6" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import Navbar from '../../components/layout/Navbar';

export default function GlossaryPage() {
  const [selected, setSelected] = useState<any>(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [question, setQuestion] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const { data: items = [] } = useQuery({
    queryKey: ['glossary', filterCat],
    queryFn: () =>
      api.get('/glossary', { params: filterCat ? { category: filterCat } : {} }).then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['glossary-categories'],
    queryFn: () => api.get('/glossary/categories').then((r) => r.data),
  });

  const aiMutation = useMutation({
    mutationFn: ({ term, context }: { term: string; context?: string }) =>
      api.post('/ai/explain', { term, context }).then((r) => r.data),
    onSuccess: (data) => setAiExplanation(data.explanation),
  });

  const openTerm = (item: any) => {
    setSelected(item);
    setAiExplanation('');
    setQuestion('');
  };

  const askAI = (q?: string) => {
    if (!selected) return;
    const ctx = q ?? question;
    aiMutation.mutate({ term: selected.term, context: ctx || undefined });
    if (q) setQuestion(q);
  };

  const QUICK_QUESTIONS = ['초보자에게 어떻게 설명하나요?', '어떤 상황에서 중요한가요?', '주의할 점은?'];

  return (
    <div className="min-h-screen bg-[#08090d]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-16 pb-24 md:pb-10">

        <div className="mt-4 mb-5">
          <h1 className="text-xl font-bold text-white mb-1">금융 용어사전</h1>
          <p className="text-slate-600 text-xs">출처: 금융감독원 금융교육센터 · 한국은행 경제교육 · 한국거래소</p>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          <button
            onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              !filterCat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#111318] border border-white/[0.06] text-slate-500 hover:text-white'
            }`}
          >
            전체
          </button>
          {categories.map((c: any) => (
            <button
              key={c.category}
              onClick={() => setFilterCat(c.category)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                filterCat === c.category
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#111318] border border-white/[0.06] text-slate-500 hover:text-white'
              }`}
            >
              {c.category}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* 용어 목록 */}
          <div className="space-y-2">
            {items.map((item: any) => (
              <motion.button
                key={item.term}
                whileTap={{ scale: 0.99 }}
                onClick={() => openTerm(item)}
                className={`w-full text-left bg-[#111318] border rounded-2xl p-4 transition-all ${
                  selected?.term === item.term
                    ? 'border-indigo-500/50 bg-indigo-950/20'
                    : 'border-white/[0.06] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white text-[15px]">{item.term}</span>
                  <span className="text-[10px] bg-white/[0.06] text-slate-400 rounded-full px-2 py-0.5">
                    {item.category}
                  </span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{item.simple}</p>
              </motion.button>
            ))}

            {items.length === 0 && (
              <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-8 text-center">
                <div className="w-10 h-10 border-2 border-white/5 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 text-sm">로딩 중...</p>
              </div>
            )}
          </div>

          {/* 용어 상세 패널 */}
          <div className="sticky top-20 self-start">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.term}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selected.term}</h2>
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded-full px-2.5 py-0.5 mt-1.5 inline-block font-medium">
                        {selected.category}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-500 hover:text-white transition"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3.5 mb-4">
                    <p className="text-indigo-200 text-sm font-medium leading-relaxed">{selected.simple}</p>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{selected.detail}</p>

                  {selected.example && (
                    <div className="flex gap-3 mb-4">
                      <div className="w-0.5 bg-emerald-500/40 rounded-full shrink-0 my-0.5" />
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">예시</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{selected.example}</p>
                      </div>
                    </div>
                  )}

                  <p className="text-slate-700 text-[11px] mb-4">출처: {selected.source}</p>

                  <div className="border-t border-white/[0.05] pt-4">
                    <p className="text-sm font-semibold text-white mb-3">AI에게 더 물어보기</p>

                    {!aiExplanation && (
                      <div className="flex gap-2 flex-wrap mb-3">
                        {QUICK_QUESTIONS.map((q) => (
                          <button
                            key={q}
                            onClick={() => askAI(q)}
                            disabled={aiMutation.isPending}
                            className="text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white rounded-xl px-3 py-2 transition disabled:opacity-50"
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
                        placeholder={`"${selected.term}"에 대해 궁금한 점...`}
                        className="flex-1 bg-[#0f1117] border border-white/[0.07] rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                      />
                      <button
                        onClick={() => askAI()}
                        disabled={aiMutation.isPending || !question}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-3 rounded-2xl text-sm font-semibold transition"
                      >
                        {aiMutation.isPending ? '...' : '질문'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {aiExplanation && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-3 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4"
                        >
                          <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{aiExplanation}</p>
                          <button
                            onClick={() => { setAiExplanation(''); setQuestion(''); }}
                            className="text-xs text-slate-600 hover:text-slate-400 mt-3 transition"
                          >
                            다시 질문하기
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#111318] border border-dashed border-white/[0.06] rounded-2xl p-10 text-center"
                >
                  <svg className="w-10 h-10 text-slate-700 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <p className="text-slate-600 text-sm">용어를 선택하면</p>
                  <p className="text-slate-600 text-sm">자세한 설명과 AI 질문을 할 수 있어요</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

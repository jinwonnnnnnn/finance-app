import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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

  const askAI = () => {
    if (!selected) return;
    aiMutation.mutate({ term: selected.term, context: question || undefined });
  };

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold text-white mb-6">📖 금융 용어사전</h1>
        <p className="text-slate-500 text-sm mb-6">
          출처: 금융감독원 금융교육센터 · 한국은행 경제교육 · 한국거래소
        </p>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-lg text-sm transition border ${
              !filterCat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-[#1a1d27] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            전체
          </button>
          {categories.map((c: any) => (
            <button
              key={c.category}
              onClick={() => setFilterCat(c.category)}
              className={`px-3 py-1.5 rounded-lg text-sm transition border ${
                filterCat === c.category ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-[#1a1d27] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c.category}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* 용어 목록 */}
          <div className="space-y-3">
            {items.map((item: any) => (
              <motion.button
                key={item.term}
                whileHover={{ scale: 1.01 }}
                onClick={() => openTerm(item)}
                className={`w-full text-left bg-[#1a1d27] border rounded-2xl p-5 transition ${
                  selected?.term === item.term ? 'border-indigo-500' : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{item.term}</span>
                  <span className="text-xs bg-slate-800 text-slate-400 rounded px-2 py-0.5">{item.category}</span>
                </div>
                <p className="text-slate-400 text-sm">{item.simple}</p>
              </motion.button>
            ))}
          </div>

          {/* 용어 상세 + AI */}
          <div className="sticky top-20">
            {selected ? (
              <motion.div
                key={selected.term}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#1a1d27] border border-slate-800 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">{selected.term}</h2>
                  <span className="text-xs bg-indigo-600/20 text-indigo-300 rounded px-2 py-1">{selected.category}</span>
                </div>
                <p className="text-slate-300 mb-4 leading-relaxed">{selected.detail}</p>
                {selected.example && (
                  <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-slate-500 mb-1">예시</p>
                    <p className="text-slate-300 text-sm">{selected.example}</p>
                  </div>
                )}
                <p className="text-xs text-slate-600 mb-6">📌 출처: {selected.source}</p>

                {/* AI 질문 */}
                <div className="border-t border-slate-800 pt-4">
                  <p className="text-sm font-semibold text-white mb-3">🤖 AI에게 더 물어보기</p>
                  <div className="flex gap-2">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={`"${selected.term}" 에 대해 궁금한 점...`}
                      className="flex-1 bg-[#0f1117] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={askAI}
                      disabled={aiMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                    >
                      {aiMutation.isPending ? '...' : '질문'}
                    </button>
                  </div>
                  {aiExplanation && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 bg-indigo-900/20 border border-indigo-800/50 rounded-xl p-4"
                    >
                      <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{aiExplanation}</p>
                    </motion.div>
                  )}
                  {!question && !aiExplanation && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {['초보자에게 어떻게 설명하나요?', '어떤 상황에서 중요한가요?', '주의할 점은?'].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setQuestion(q); }}
                          className="text-xs bg-slate-800 text-slate-400 hover:text-white rounded-lg px-3 py-1.5 transition"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#1a1d27] border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                <p className="text-3xl mb-3">📖</p>
                <p>용어를 선택하면 자세한 설명과 AI 질문을 할 수 있어요</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

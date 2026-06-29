import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';

interface Advice {
  headline: string;
  suggestion: string;
  portfolioIdea: string;
  riskNote: string;
  newsContext: string;
}

export default function InvestmentAdviceCard() {
  const { data, isLoading, isError, refetch } = useQuery<Advice>({
    queryKey: ['investment-advice'],
    queryFn: () => api.get('/ai/investment-advice').then((r) => r.data),
    staleTime: 1000 * 60 * 30, // 30분 캐시
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-800/40 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
        <div className="h-3 bg-slate-700 rounded w-full mb-2" />
        <div className="h-3 bg-slate-700 rounded w-5/6" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-[#1a1d27] border border-slate-800 rounded-2xl p-6 text-center">
        <p className="text-slate-500 text-sm">투자 제안을 불러오지 못했습니다.</p>
        <button onClick={() => refetch()} className="text-indigo-400 text-sm mt-2 hover:text-indigo-300">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-700/40 rounded-2xl p-6"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-semibold">AI 투자 제안</span>
          </div>
          <h3 className="text-white font-bold text-lg leading-tight">{data.headline}</h3>
        </div>
        <button
          onClick={() => refetch()}
          className="text-slate-500 hover:text-slate-300 transition text-xs bg-slate-800 px-2 py-1 rounded-lg"
        >
          새로고침
        </button>
      </div>

      {/* 뉴스 컨텍스트 */}
      <div className="bg-slate-800/50 rounded-xl px-4 py-3 mb-4 border-l-2 border-indigo-500">
        <p className="text-xs text-slate-400 mb-0.5">📰 시장 동향</p>
        <p className="text-slate-300 text-sm">{data.newsContext}</p>
      </div>

      {/* 투자 제안 */}
      <p className="text-slate-300 text-sm leading-relaxed mb-4">{data.suggestion}</p>

      {/* 포트폴리오 아이디어 */}
      <div className="bg-indigo-900/30 border border-indigo-800/40 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs text-indigo-300 font-semibold mb-1">💼 포트폴리오 제안</p>
        <p className="text-slate-200 text-sm font-medium">{data.portfolioIdea}</p>
      </div>

      {/* 리스크 경고 */}
      <div className="flex items-start gap-2">
        <span className="text-amber-400 text-xs mt-0.5">⚠️</span>
        <p className="text-amber-400/80 text-xs">{data.riskNote}</p>
      </div>

      <p className="text-slate-600 text-xs mt-3">
        * AI 분석은 참고용이며 투자 손실 책임은 본인에게 있습니다. (금융감독원 안내)
      </p>
    </motion.div>
  );
}

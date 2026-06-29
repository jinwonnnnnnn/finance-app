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
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <div className="h-3 bg-white/5 rounded w-20 animate-pulse" />
        </div>
        <div className="h-5 bg-white/5 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-white/5 rounded w-full animate-pulse" />
        <div className="h-3 bg-white/5 rounded w-5/6 animate-pulse" />
        <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 text-center py-8">
        <p className="text-slate-500 text-sm mb-3">투자 제안을 불러오지 못했습니다.</p>
        <button
          onClick={() => refetch()}
          className="text-indigo-400 text-sm hover:text-indigo-300 transition bg-indigo-500/10 px-4 py-2 rounded-xl"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-[#111318] border border-white/[0.06] rounded-2xl p-5"
    >
      {/* 배경 글로우 */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-semibold tracking-wider uppercase">AI 투자 제안</span>
        </div>
        <button
          onClick={() => refetch()}
          className="text-slate-600 hover:text-slate-300 transition p-1.5 rounded-lg hover:bg-white/[0.05]"
          title="새로고침"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      <h3 className="text-white font-bold text-lg leading-snug mb-4 relative">{data.headline}</h3>

      {/* 뉴스 컨텍스트 */}
      <div className="flex gap-3 mb-4 relative">
        <div className="w-0.5 bg-indigo-500/50 rounded-full shrink-0 my-0.5" />
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">시장 동향</p>
          <p className="text-slate-300 text-sm leading-relaxed">{data.newsContext}</p>
        </div>
      </div>

      {/* 제안 내용 */}
      <p className="text-slate-400 text-sm leading-relaxed mb-4 relative">{data.suggestion}</p>

      {/* 포트폴리오 */}
      <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl px-4 py-3 mb-3 relative">
        <p className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider mb-1.5">포트폴리오 제안</p>
        <p className="text-slate-200 text-sm font-medium">{data.portfolioIdea}</p>
      </div>

      {/* 리스크 경고 */}
      <div className="flex items-start gap-2 relative">
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
        <p className="text-amber-400/70 text-xs leading-relaxed">{data.riskNote}</p>
      </div>

      <p className="text-slate-700 text-[10px] mt-3 relative">
        * AI 분석은 참고용입니다. 투자 손실의 책임은 본인에게 있습니다. (금융감독원 안내)
      </p>
    </motion.div>
  );
}

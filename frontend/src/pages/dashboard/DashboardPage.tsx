import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import Navbar from '../../components/layout/Navbar';
import StockCard from '../../components/ui/StockCard';
import InvestmentAdviceCard from '../../components/ui/InvestmentAdviceCard';
import GlossaryModal from '../../components/ui/GlossaryModal';
import AppTour from '../../components/ui/AppTour';

interface DailyTip {
  icon: string;
  title: string;
  body: string;
  category: string;
}

const LEARN_SHORTCUTS = [
  {
    icon: '📖',
    label: '용어사전',
    desc: '금융 용어 한 번에 정리',
    to: '/glossary',
  },
  {
    icon: '📰',
    label: '뉴스',
    desc: '오늘의 금융 뉴스',
    to: '/news',
  },
  {
    icon: '🤖',
    label: 'AI 상담',
    desc: '핀이에게 질문하기',
    to: null,
  },
];

const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple', market: 'US' as const },
  { symbol: 'TSLA', name: 'Tesla', market: 'US' as const },
  { symbol: 'NVDA', name: 'NVIDIA', market: 'US' as const },
  { symbol: 'MSFT', name: 'Microsoft', market: 'US' as const },
  { symbol: 'GOOGL', name: 'Alphabet', market: 'US' as const },
  { symbol: 'AMZN', name: 'Amazon', market: 'US' as const },
];

const INTEREST_LABELS: Record<string, string> = {
  STOCK_KR: '국내주식',
  STOCK_US: '해외주식',
  COIN: '코인',
  PENSION: '퇴직연금',
};

function SectionHeader({ title, to, cta }: { title: string; to?: string; cta?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[15px] font-semibold text-white">{title}</h2>
      {to && cta && (
        <Link to={to} className="text-indigo-400 text-xs hover:text-indigo-300 transition font-medium">
          {cta} →
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [selectedTerm, setSelectedTerm] = useState<any>(null);

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.get('/watchlist').then((r) => r.data),
  });

  const { data: glossary = [] } = useQuery({
    queryKey: ['glossary-today'],
    queryFn: () => api.get('/glossary').then((r) => r.data.slice(0, 3)),
  });

  const { data: dailyContent, isLoading: tipsLoading } = useQuery<{ tips: DailyTip[] }>({
    queryKey: ['daily-content'],
    queryFn: () => api.get('/ai/daily-content').then((r) => r.data),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-[#08090d]">
      <Navbar />
      <AppTour />

      <main className="max-w-6xl mx-auto px-4 pt-16 pb-24 md:pb-10">
        {/* 환영 히어로 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-2xl bg-[#111318] border border-white/[0.06] p-6 mb-5 mt-4"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[60px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-violet-600/8 rounded-full blur-[50px] pointer-events-none" />
          <div className="relative">
            <p className="text-slate-500 text-xs mb-1">안녕하세요</p>
            <h1 className="text-xl font-bold text-white mb-3">{user?.nickname}님, 좋은 하루예요</h1>
            <div className="flex flex-wrap gap-1.5">
              {user?.interests?.map((i) => (
                <span
                  key={i}
                  className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 rounded-full px-2.5 py-1 text-[11px] font-medium"
                >
                  {INTEREST_LABELS[i] ?? i}
                </span>
              ))}
            </div>
          </div>
        </motion.section>

        {/* AI 투자 제안 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-5"
        >
          <SectionHeader title="지금 이런 투자는 어때요?" />
          <InvestmentAdviceCard />
        </motion.section>

        {/* 관심종목 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mb-5"
        >
          <SectionHeader title="관심종목" to="/stock/us" cta="전체보기" />
          {watchlist.length === 0 ? (
            <Link
              to="/stock/us"
              className="flex items-center gap-4 bg-[#111318] border border-dashed border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-5 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="text-slate-300 text-sm font-medium group-hover:text-white transition">관심종목 추가하기</p>
                <p className="text-slate-600 text-xs mt-0.5">주식 화면에서 ⭐ 버튼을 눌러보세요</p>
              </div>
            </Link>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {watchlist.map((item: any) => (
                <StockCard key={item.symbol} symbol={item.symbol} name={item.name} market={item.market ?? 'US'} />
              ))}
            </div>
          )}
        </motion.section>

        {/* 인기 종목 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mb-5"
        >
          <SectionHeader title="인기 종목" to="/stock/us" cta="더보기" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {POPULAR_SYMBOLS.map((s) => (
              <StockCard key={s.symbol} symbol={s.symbol} name={s.name} market={s.market} />
            ))}
          </div>
        </motion.section>

        {/* 오늘의 금융 팁 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="mb-5"
        >
          <SectionHeader title="오늘의 금융 팁" />
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
            {tipsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-44 bg-[#111318] border border-white/[0.06] rounded-2xl p-4 animate-pulse"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/5 mb-3" />
                    <div className="h-3.5 bg-white/5 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-full mb-1.5" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                ))
              : (dailyContent?.tips ?? []).map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex-shrink-0 w-44 bg-[#111318] border border-white/[0.06] hover:border-indigo-500/25 rounded-2xl p-4 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl mb-3">
                      {tip.icon}
                    </div>
                    <span className="text-[10px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5 font-medium">
                      {tip.category}
                    </span>
                    <p className="text-white text-[13px] font-semibold mt-2 mb-1 leading-tight">
                      {tip.title}
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed">{tip.body}</p>
                  </motion.div>
                ))}
          </div>
        </motion.section>

        {/* 금융 학습 바로가기 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="mb-5"
        >
          <SectionHeader title="금융 학습 바로가기" />
          <div className="grid grid-cols-3 gap-2">
            {LEARN_SHORTCUTS.map((item) =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="bg-[#111318] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-indigo-950/20 rounded-2xl p-4 transition-all group"
                >
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <p className="text-white text-[13px] font-semibold leading-tight">{item.label}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-tight">{item.desc}</p>
                  <p className="text-indigo-400/60 text-[11px] mt-2 group-hover:text-indigo-400 transition">
                    바로가기 →
                  </p>
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={() => window.dispatchEvent(new Event('open-chatbot'))}
                  className="text-left bg-[#111318] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-indigo-950/20 rounded-2xl p-4 transition-all group"
                >
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <p className="text-white text-[13px] font-semibold leading-tight">{item.label}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-tight">{item.desc}</p>
                  <p className="text-indigo-400/60 text-[11px] mt-2 group-hover:text-indigo-400 transition">
                    열기 →
                  </p>
                </button>
              )
            )}
          </div>
        </motion.section>

        {/* 오늘의 금융 용어 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <SectionHeader title="오늘의 금융 용어" to="/glossary" cta="용어사전" />
          <div className="grid md:grid-cols-3 gap-2">
            {glossary.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-1/2 mb-3" />
                    <div className="h-3 bg-white/5 rounded w-full mb-2" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                ))
              : glossary.map((item: any) => (
                  <motion.button
                    key={item.term}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTerm(item)}
                    className="text-left bg-[#111318] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-indigo-950/20 rounded-2xl p-5 transition-all w-full group"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-bold text-white text-[15px]">{item.term}</span>
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded-full px-2 py-0.5 font-medium">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.simple}</p>
                    <p className="text-indigo-400/70 text-xs mt-3 group-hover:text-indigo-400 transition">
                      탭해서 AI 설명 보기 →
                    </p>
                  </motion.button>
                ))}
          </div>
        </motion.section>
      </main>

      <GlossaryModal item={selectedTerm} onClose={() => setSelectedTerm(null)} />
    </div>
  );
}

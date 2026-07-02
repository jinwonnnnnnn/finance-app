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

const US_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple', market: 'US' as const },
  { symbol: 'TSLA', name: 'Tesla', market: 'US' as const },
  { symbol: 'NVDA', name: 'NVIDIA', market: 'US' as const },
  { symbol: 'MSFT', name: 'Microsoft', market: 'US' as const },
  { symbol: 'GOOGL', name: 'Alphabet', market: 'US' as const },
  { symbol: 'AMZN', name: 'Amazon', market: 'US' as const },
];

const KR_SYMBOLS = [
  { symbol: '005930', name: '삼성전자', market: 'KR' as const },
  { symbol: '000660', name: 'SK하이닉스', market: 'KR' as const },
  { symbol: '035420', name: 'NAVER', market: 'KR' as const },
  { symbol: '035720', name: '카카오', market: 'KR' as const },
  { symbol: '051910', name: 'LG화학', market: 'KR' as const },
  { symbol: '105560', name: 'KB금융', market: 'KR' as const },
];

const INTEREST_LABELS: Record<string, string> = {
  STOCK_KR: '국내주식',
  STOCK_US: '해외주식',
  COIN: '코인',
  PENSION: '퇴직연금',
};

const INTEREST_PATHS: Record<string, string> = {
  STOCK_KR: '/stock/kr',
  STOCK_US: '/stock/us',
  COIN: '/coin',
  PENSION: '/glossary?category=퇴직연금',
};

function getPopularSymbols(interests: string[] = []) {
  const hasKR = interests.includes('STOCK_KR');
  const hasUS = interests.includes('STOCK_US');
  if (hasKR && hasUS) return [...KR_SYMBOLS.slice(0, 3), ...US_SYMBOLS.slice(0, 3)];
  if (hasKR) return KR_SYMBOLS;
  return US_SYMBOLS;
}

function getPopularTitle(interests: string[] = []) {
  const hasKR = interests.includes('STOCK_KR');
  const hasUS = interests.includes('STOCK_US');
  if (hasKR && hasUS) return '인기 종목';
  if (hasKR) return '인기 종목 (국내)';
  return '인기 종목 (해외)';
}

function getPopularLink(interests: string[] = []) {
  const hasKR = interests.includes('STOCK_KR');
  const hasUS = interests.includes('STOCK_US');
  if (hasKR && !hasUS) return '/stock/kr';
  return '/stock/us';
}

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

  const interests = user?.interests ?? [];
  const popularSymbols = getPopularSymbols(interests);
  const popularTitle = getPopularTitle(interests);
  const popularLink = getPopularLink(interests);

  return (
    <div className="min-h-dvh bg-[#08090d]">
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
              {interests.map((i) => (
                <Link
                  key={i}
                  to={INTEREST_PATHS[i] ?? '/dashboard'}
                  className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/25 hover:border-indigo-400/40 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all"
                >
                  {INTEREST_LABELS[i] ?? i}
                </Link>
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
          <SectionHeader title={popularTitle} to={popularLink} cta="더보기" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {popularSymbols.map((s) => (
              <StockCard key={s.symbol} symbol={s.symbol} name={s.name} market={s.market} />
            ))}
          </div>
        </motion.section>

        {/* 오늘의 금융 용어 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
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

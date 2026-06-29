import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import Navbar from '../../components/layout/Navbar';
import StockCard from '../../components/ui/StockCard';
import InvestmentAdviceCard from '../../components/ui/InvestmentAdviceCard';
import GlossaryModal from '../../components/ui/GlossaryModal';
import AppTour from '../../components/ui/AppTour';

const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple', market: 'US' },
  { symbol: 'TSLA', name: 'Tesla', market: 'US' },
  { symbol: 'NVDA', name: 'NVIDIA', market: 'US' },
  { symbol: 'MSFT', name: 'Microsoft', market: 'US' },
];

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

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navbar />
      <AppTour />

      <main className="max-w-6xl mx-auto px-4 pt-20 pb-24 md:pb-8">
        {/* 환영 */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-1">
            안녕하세요, {user?.nickname}님 👋
          </h1>
          <p className="text-slate-400 text-sm">
            관심 분야:{' '}
            {user?.interests?.map((i) => (
              <span key={i} className="inline-block bg-indigo-600/20 text-indigo-300 rounded px-2 py-0.5 text-xs mr-1">
                {i === 'STOCK_KR' ? '국내주식' : i === 'STOCK_US' ? '해외주식' : i === 'COIN' ? '코인' : '퇴직연금'}
              </span>
            ))}
          </p>
        </motion.section>

        {/* AI 투자 제안 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">🤖 지금 이런 투자는 어떠세요?</h2>
          <InvestmentAdviceCard />
        </section>

        {/* 관심종목 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">⭐ 관심종목</h2>
          {watchlist.length === 0 ? (
            <div className="bg-[#1a1d27] rounded-2xl p-6 text-center text-slate-500 border border-slate-800 border-dashed">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm">아직 관심종목이 없어요.</p>
              <p className="text-xs text-slate-600 mt-1">주식 탭에서 종목 검색 후 ⭐ 버튼을 눌러보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {watchlist.map((item: any) => (
                <StockCard key={item.symbol} symbol={item.symbol} name={item.name} />
              ))}
            </div>
          )}
        </section>

        {/* 인기 종목 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">🔥 인기 종목</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {POPULAR_SYMBOLS.map((s) => (
              <StockCard key={s.symbol} symbol={s.symbol} name={s.name} />
            ))}
          </div>
        </section>

        {/* 오늘의 금융 용어 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">📚 오늘의 금융 용어</h2>
          <p className="text-slate-600 text-xs mb-4">눌러보면 자세한 설명과 AI 질문을 할 수 있어요</p>
          <div className="grid md:grid-cols-3 gap-3">
            {glossary.map((item: any) => (
              <motion.button
                key={item.term}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTerm(item)}
                className="text-left bg-[#1a1d27] border border-slate-800 hover:border-indigo-700 rounded-2xl p-5 transition cursor-pointer w-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">{item.term}</span>
                  <span className="text-xs bg-indigo-600/20 text-indigo-300 rounded px-2 py-0.5">{item.category}</span>
                </div>
                <p className="text-slate-400 text-sm">{item.simple}</p>
                <p className="text-indigo-400 text-xs mt-3">탭해서 자세히 보기 →</p>
              </motion.button>
            ))}
          </div>
        </section>
      </main>

      {/* 용어 모달 */}
      <GlossaryModal item={selectedTerm} onClose={() => setSelectedTerm(null)} />
    </div>
  );
}

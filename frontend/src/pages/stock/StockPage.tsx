import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import Navbar from '../../components/layout/Navbar';

const PERIODS = [
  { label: '1일', resolution: '5', days: 1 },
  { label: '1주', resolution: '60', days: 7 },
  { label: '1달', resolution: 'D', days: 30 },
  { label: '3달', resolution: 'D', days: 90 },
  { label: '1년', resolution: 'W', days: 365 },
];

const US_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'];
const KR_SYMBOLS = ['005930', '000660', '035420', '035720', '051910'];
const KR_NAMES: Record<string, string> = {
  '005930': '삼성전자',
  '000660': 'SK하이닉스',
  '035420': 'NAVER',
  '035720': '카카오',
  '051910': 'LG화학',
};

interface Props {
  market: 'US' | 'KR';
}

export default function StockPage({ market }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [period, setPeriod] = useState(PERIODS[2]);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);
  const [watchlistMsg, setWatchlistMsg] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // market 탭 전환 시 검색창 초기화
  useEffect(() => { setSearch(''); setSearchQuery(''); setActiveIdx(-1); }, [market]);

  // 입력 300ms 뒤 자동 검색
  useEffect(() => {
    setActiveIdx(-1);
    if (search.trim().length < 2) { setSearchQuery(''); return; }
    const t = setTimeout(() => setSearchQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const defaultSymbol = market === 'US' ? 'AAPL' : '005930';
  const symbol = searchParams.get('symbol') ?? defaultSymbol;
  const quickSymbols = market === 'US' ? US_SYMBOLS : KR_SYMBOLS;

  const now = Math.floor(Date.now() / 1000);
  const from = now - period.days * 86400;

  const { data: quote } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => api.get(`/stock/${symbol}/quote`, { params: { market } }).then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: candles = [], isLoading } = useQuery({
    queryKey: ['candles', symbol, period.label],
    queryFn: () =>
      api.get(`/stock/${symbol}/candles`, {
        params: { resolution: period.resolution, from, to: now, market },
      }).then((r) => r.data),
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['search', searchQuery, market],
    queryFn: () => api.get('/stock/search', { params: { q: searchQuery, market } }).then((r) => r.data),
    enabled: searchQuery.length > 1,
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery(''); setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = () => {
    if (search.trim().length > 1) setSearchQuery(search.trim());
  };

  const chartData = candles.map((c: any) => ({
    time: new Date(c.time * 1000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    price: c.close,
  }));

  const changePercent = quote?.changePercent ?? 0;
  const isUp = changePercent >= 0;
  const upColor = '#10b981';
  const downColor = '#ef4444';
  const color = isUp ? upColor : downColor;
  const currency = market === 'US' ? '$' : '₩';

  const addToWatchlist = async () => {
    try {
      const name = market === 'KR' ? (KR_NAMES[symbol] ?? symbol) : symbol;
      await api.post('/watchlist', { symbol, name, market });
      setWatchlistMsg('관심종목에 추가되었습니다');
      setTimeout(() => setWatchlistMsg(''), 2500);
    } catch {
      setWatchlistMsg('이미 추가된 종목입니다');
      setTimeout(() => setWatchlistMsg(''), 2500);
    }
  };

  const displaySymbol = market === 'KR' ? (KR_NAMES[symbol] ?? symbol) : symbol;

  return (
    <div className="min-h-screen bg-[#08090d]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-16 pb-24 md:pb-10">
        {/* 검색 + 관심종목 */}
        <div className="flex gap-2 mt-4 mb-4">
          <div ref={searchRef} className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  const total = Math.min(searchResults.length, 6);
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIdx((i) => (i + 1) % total);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIdx((i) => (i <= 0 ? total - 1 : i - 1));
                  } else if (e.key === 'Enter') {
                    if (activeIdx >= 0 && searchResults[activeIdx]) {
                      const r = searchResults[activeIdx];
                      setSearchParams({ symbol: r.symbol });
                      setSearch(''); setSearchQuery(''); setActiveIdx(-1);
                    } else {
                      handleSearch();
                    }
                  } else if (e.key === 'Escape') {
                    setSearchQuery(''); setSearch(''); setActiveIdx(-1);
                  }
                }}
                placeholder={market === 'US' ? 'AAPL, TSLA, Apple...' : 'Samsung, Kakao, SK, Naver...'}
                className="w-full bg-[#111318] border border-white/[0.07] rounded-2xl pl-9 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={search.trim().length < 2}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-3 rounded-2xl text-sm font-medium transition whitespace-nowrap"
            >
              {isSearching ? '검색 중...' : '검색'}
            </button>
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1.5 bg-[#111318] border border-white/[0.08] rounded-2xl overflow-hidden z-20 shadow-2xl"
                >
                  {searchResults.slice(0, 6).map((r: any, idx: number) => {
                    const isActive = idx === activeIdx;
                    return (
                    <button
                      key={r.symbol}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onMouseLeave={() => setActiveIdx(-1)}
                      onClick={() => {
                        setSearchParams({ symbol: r.symbol });
                        setSearch(''); setSearchQuery(''); setActiveIdx(-1);
                      }}
                      className={`w-full text-left px-4 py-3 transition text-sm flex items-center gap-3 ${
                        isActive
                          ? 'bg-indigo-500/20 border-l-2 border-indigo-400'
                          : 'hover:bg-white/[0.04] border-l-2 border-transparent'
                      }`}
                    >
                      {market === 'KR' ? (
                        <>
                          <span className={`font-bold truncate flex-1 ${isActive ? 'text-indigo-200' : 'text-white'}`}>
                            {r.description || KR_NAMES[r.symbol] || r.symbol}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-md shrink-0 font-mono ${
                            isActive ? 'text-indigo-300 bg-indigo-500/20' : 'text-slate-500 bg-white/[0.06]'
                          }`}>
                            {r.symbol}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={`font-bold shrink-0 ${isActive ? 'text-indigo-200' : 'text-white'}`}>{r.symbol}</span>
                          <span className={`truncate ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>{r.description}</span>
                        </>
                      )}
                    </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={addToWatchlist}
            className="bg-[#111318] hover:bg-white/[0.05] border border-white/[0.07] text-white px-4 py-3 rounded-2xl text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
            관심종목
          </button>
        </div>

        {/* 토스트 */}
        <AnimatePresence>
          {watchlistMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 bg-[#111318] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-300 text-center"
            >
              {watchlistMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 시세 헤더 */}
        <motion.div
          key={symbol}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 mb-3"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-2xl font-bold text-white tabular-nums">{displaySymbol}</h2>
                <span className="text-xs text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
                  {market === 'US' ? 'NASDAQ' : 'KOSPI'}
                </span>
              </div>
              <p className="text-slate-500 text-xs">{market === 'US' ? '미국 주식' : '국내 주식'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white tabular-nums">
                {quote
                  ? `${currency}${market === 'KR' ? Math.floor(quote.current).toLocaleString() : quote.current.toFixed(2)}`
                  : <span className="text-slate-600">—</span>}
              </p>
              <div className={`flex items-center justify-end gap-1 mt-1 text-sm font-semibold tabular-nums ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  {isUp
                    ? <path fillRule="evenodd" d="M12 20.25a.75.75 0 01-.75-.75V6.31L5.47 12.53a.75.75 0 01-1.06-1.06l7.5-7.5a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06l-5.78-5.97v13.19a.75.75 0 01-.75.75z" clipRule="evenodd" />
                    : <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v13.19l5.78-5.97a.75.75 0 111.06 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 111.06-1.06l5.78 5.97V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                  }
                </svg>
                {Math.abs(quote?.change ?? 0).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/[0.05]">
            {[
              { label: '시가', value: quote?.open },
              { label: '고가', value: quote?.high },
              { label: '저가', value: quote?.low },
              { label: '전일', value: quote?.prevClose },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-slate-600 text-[10px] uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-white text-sm font-semibold tabular-nums">
                  {item.value
                    ? market === 'KR'
                      ? `₩${Math.floor(item.value).toLocaleString()}`
                      : `$${item.value.toFixed(2)}`
                    : '—'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 기간 선택 */}
        <div className="flex gap-1.5 mb-2">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                period.label === p.label
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 차트 */}
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-4 mb-4">
          {isLoading ? (
            <div className="h-60 flex flex-col items-center justify-center gap-3 text-slate-600">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-sm">차트 로딩 중</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-slate-600 text-sm">
              차트 데이터가 없습니다
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#475569', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#475569', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(v) => `${currency}${Number(v).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0f1117',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: '#64748b', fontSize: 11 }}
                  itemStyle={{ color: '#fff', fontWeight: 600 }}
                  formatter={(v: any) => [`${currency}${Number(v).toFixed(2)}`, '가격']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  fill="url(#colorGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 빠른 종목 선택 */}
        <div>
          <p className="text-slate-600 text-[11px] uppercase tracking-wider mb-2">빠른 선택</p>
          <div className="flex gap-2 flex-wrap">
            {quickSymbols.map((s) => (
              <button
                key={s}
                onClick={() => setSearchParams({ symbol: s })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  symbol === s
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'bg-[#111318] border border-white/[0.06] text-slate-500 hover:text-white hover:border-white/[0.15]'
                }`}
              >
                {market === 'KR' ? (KR_NAMES[s] ?? s) : s}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

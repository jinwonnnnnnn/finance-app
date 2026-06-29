import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import Navbar from '../../components/layout/Navbar';

const PERIODS = [
  { label: '1일', resolution: '5', days: 1 },
  { label: '1주', resolution: '60', days: 7 },
  { label: '1달', resolution: 'D', days: 30 },
  { label: '3달', resolution: 'D', days: 90 },
  { label: '1년', resolution: 'W', days: 365 },
];

const DEFAULT_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'];

interface Props {
  market: 'US' | 'KR';
}

export default function StockPage({ market }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [period, setPeriod] = useState(PERIODS[2]);
  const [search, setSearch] = useState('');
  const symbol = searchParams.get('symbol') ?? 'AAPL';

  const now = Math.floor(Date.now() / 1000);
  const from = now - period.days * 86400;

  const { data: quote } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => api.get(`/stock/${symbol}/quote`).then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: candles = [], isLoading } = useQuery({
    queryKey: ['candles', symbol, period.label],
    queryFn: () =>
      api.get(`/stock/${symbol}/candles`, {
        params: { resolution: period.resolution, from, to: now },
      }).then((r) => r.data),
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['search', search],
    queryFn: () => api.get('/stock/search', { params: { q: search } }).then((r) => r.data),
    enabled: search.length > 1,
  });

  const chartData = candles.map((c: any) => ({
    time: new Date(c.time * 1000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    price: c.close,
  }));

  const isUp = (quote?.changePercent ?? 0) >= 0;
  const color = isUp ? '#22c55e' : '#ef4444';

  const addToWatchlist = async () => {
    await api.post('/watchlist', { symbol, name: symbol, market });
  };

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-24 md:pb-8">
        <div className="flex gap-3 mb-6">
          {/* 검색창 */}
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={market === 'US' ? 'AAPL, TSLA 검색...' : '삼성전자 검색...'}
              className="w-full bg-[#1a1d27] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            {searchResults.length > 0 && search.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d27] border border-slate-700 rounded-xl overflow-hidden z-10 shadow-2xl">
                {searchResults.map((r: any) => (
                  <button
                    key={r.symbol}
                    onClick={() => {
                      setSearchParams({ symbol: r.symbol });
                      setSearch('');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-800 transition text-white text-sm"
                  >
                    <span className="font-bold">{r.symbol}</span>
                    <span className="text-slate-400 ml-2">{r.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={addToWatchlist}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap"
          >
            ⭐ 관심종목
          </button>
        </div>

        {/* 시세 헤더 */}
        <motion.div
          key={symbol}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#1a1d27] border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">{symbol}</h2>
              <p className="text-slate-400 text-sm mt-1">{market === 'US' ? '미국 주식' : '국내 주식'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                {quote ? `$${quote.current.toFixed(2)}` : '—'}
              </p>
              <p className={`text-sm font-semibold mt-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '▲' : '▼'} {Math.abs(quote?.change ?? 0).toFixed(2)} ({Math.abs(quote?.changePercent ?? 0).toFixed(2)}%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
            {[
              { label: '시가', value: quote?.open?.toFixed(2) },
              { label: '고가', value: quote?.high?.toFixed(2) },
              { label: '저가', value: quote?.low?.toFixed(2) },
              { label: '전일종가', value: quote?.prevClose?.toFixed(2) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-slate-500 text-xs">{item.label}</p>
                <p className="text-white font-semibold">${item.value ?? '—'}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 기간 선택 */}
        <div className="flex gap-2 mb-4">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                period.label === p.label
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#1a1d27] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 차트 */}
        <div className="bg-[#1a1d27] border border-slate-800 rounded-2xl p-4 mb-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              차트 로딩 중...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(v: any) => [`$${Number(v).toFixed(2)}`, '가격']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  fill="url(#colorGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 빠른 종목 선택 */}
        <div className="flex gap-2 flex-wrap">
          {DEFAULT_SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => setSearchParams({ symbol: s })}
              className={`px-3 py-1.5 rounded-lg text-sm transition border ${
                symbol === s
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-[#1a1d27] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

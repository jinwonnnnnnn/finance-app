import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';

const COINGECKO = 'https://api.coingecko.com/api/v3';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtPrice(n: number) {
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(6)}`;
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1d27] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white">
      {fmtPrice(payload[0].value)}
    </div>
  );
}

export default function CoinPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Coin | null>(null);
  const [chartDays, setChartDays] = useState(7);

  const { data: coins = [], isLoading } = useQuery<Coin[]>({
    queryKey: ['coin-markets'],
    queryFn: () =>
      axios
        .get(`${COINGECKO}/coins/markets`, {
          params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 30, page: 1, sparkline: false },
        })
        .then((r) => r.data),
    refetchInterval: 30000,
    staleTime: 20000,
  });

  const { data: chartRaw } = useQuery({
    queryKey: ['coin-chart', selected?.id, chartDays],
    queryFn: () =>
      axios
        .get(`${COINGECKO}/coins/${selected!.id}/market_chart`, {
          params: { vs_currency: 'usd', days: chartDays },
        })
        .then((r) => r.data.prices as [number, number][]),
    enabled: !!selected,
  });

  const chartData = (chartRaw ?? []).map(([ts, price]: [number, number]) => ({
    time: new Date(ts).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    price,
  }));

  const filtered = coins.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase()),
  );

  const isUp = (selected?.price_change_percentage_24h ?? 0) >= 0;
  const chartColor = selected ? (isUp ? '#34d399' : '#f87171') : '#818cf8';

  const PERIOD_OPTIONS = [
    { label: '1일', days: 1 },
    { label: '1주', days: 7 },
    { label: '1달', days: 30 },
    { label: '3달', days: 90 },
    { label: '1년', days: 365 },
  ];

  return (
    <div className="min-h-screen bg-[#08090d]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-16 pb-24 md:pb-10">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 mb-5"
        >
          <h1 className="text-xl font-bold text-white mb-1">암호화폐</h1>
          <p className="text-slate-500 text-sm">시가총액 기준 상위 코인</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* 코인 목록 */}
          <div className="flex-1">
            {/* 검색창 */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="코인명 또는 심볼로 검색..."
                className="w-full bg-[#111318] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/40"
              />
            </div>

            {/* 코인 리스트 */}
            <div className="space-y-1.5">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-[#111318] border border-white/[0.06] rounded-xl p-4 animate-pulse h-16" />
                  ))
                : filtered.map((coin, i) => {
                    const up = coin.price_change_percentage_24h >= 0;
                    const isSelected = selected?.id === coin.id;
                    return (
                      <motion.button
                        key={coin.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelected(isSelected ? null : coin)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'bg-indigo-950/30 border-indigo-500/40'
                            : 'bg-[#111318] border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <span className="text-slate-500 text-xs w-5 text-center flex-shrink-0">{i + 1}</span>
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{coin.name}</p>
                          <p className="text-slate-500 text-xs uppercase">{coin.symbol}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white text-sm font-semibold">{fmtPrice(coin.current_price)}</p>
                          <p className={`text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                            {up ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className="text-slate-500 text-xs">시가총액</p>
                          <p className="text-slate-300 text-xs">{fmt(coin.market_cap)}</p>
                        </div>
                      </motion.button>
                    );
                  })}
            </div>
          </div>

          {/* 차트 패널 */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:w-80 xl:w-96"
              >
                <div className="sticky top-20 bg-[#111318] border border-white/[0.07] rounded-2xl p-5">
                  {/* 코인 헤더 */}
                  <div className="flex items-center gap-3 mb-4">
                    <img src={selected.image} alt={selected.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-white font-bold">{selected.name}</p>
                      <p className="text-slate-500 text-xs uppercase">{selected.symbol}</p>
                    </div>
                  </div>

                  {/* 가격 */}
                  <p className="text-2xl font-bold text-white mb-1">{fmtPrice(selected.current_price)}</p>
                  <p className={`text-sm font-medium mb-4 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(selected.price_change_percentage_24h).toFixed(2)}% (24h)
                  </p>

                  {/* 기간 선택 */}
                  <div className="flex gap-1 mb-4">
                    {PERIOD_OPTIONS.map((p) => (
                      <button
                        key={p.days}
                        onClick={() => setChartDays(p.days)}
                        className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${
                          chartDays === p.days
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* 차트 */}
                  <div className="h-40 -mx-1">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="coinGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" hide />
                          <YAxis domain={['auto', 'auto']} hide />
                          <Tooltip content={<ChartTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={chartColor}
                            strokeWidth={2}
                            fill="url(#coinGrad)"
                            dot={false}
                            activeDot={{ r: 3, fill: chartColor }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* 추가 정보 */}
                  <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-slate-500 text-[11px]">거래량 (24h)</p>
                      <p className="text-white text-sm font-medium">{fmt(selected.total_volume)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">시가총액</p>
                      <p className="text-white text-sm font-medium">{fmt(selected.market_cap)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

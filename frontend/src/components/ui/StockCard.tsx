import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

interface Props {
  symbol: string;
  name: string;
  market?: 'US' | 'KR';
}

export default function StockCard({ symbol, name, market = 'US' }: Props) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => api.get(`/stock/${symbol}/quote`, { params: { market } }).then((r) => r.data),
    refetchInterval: 30000,
  });

  const changePercent = data?.changePercent ?? 0;
  const isUp = changePercent >= 0;
  const colorClass = isUp ? 'text-emerald-400' : 'text-red-400';
  const bgClass = isUp ? 'bg-emerald-500/10' : 'bg-red-500/10';

  return (
    <button
      onClick={() => navigate(`/stock/${market.toLowerCase()}?symbol=${symbol}`)}
      className="w-full text-left bg-[#111318] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] rounded-2xl p-4 transition-all active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-3">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-white text-sm">{symbol}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${bgClass} ${colorClass}`}>
              {isUp ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
          <p className="text-slate-500 text-xs truncate">{name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-white font-bold text-base tabular-nums">
            {data
              ? market === 'KR'
                ? `₩${Math.floor(data.current).toLocaleString()}`
                : `$${data.current.toFixed(2)}`
              : <span className="text-slate-600">—</span>}
          </p>
          <p className={`text-xs tabular-nums ${colorClass}`}>
            {data ? `${isUp ? '+' : ''}${data.change?.toFixed(2)}` : ''}
          </p>
        </div>
      </div>
    </button>
  );
}

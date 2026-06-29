import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

interface Props {
  symbol: string;
  name: string;
}

export default function StockCard({ symbol, name }: Props) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => api.get(`/stock/${symbol}/quote`).then((r) => r.data),
    refetchInterval: 30000,
  });

  const changePercent = data?.changePercent ?? 0;
  const isUp = changePercent >= 0;

  return (
    <div
      onClick={() => navigate(`/stock/us?symbol=${symbol}`)}
      className="bg-[#1a1d27] border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-600 transition"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-white text-sm">{symbol}</p>
          <p className="text-slate-500 text-xs">{name}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isUp ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
      <p className="text-xl font-bold text-white">
        {data ? `$${data.current.toFixed(2)}` : '—'}
      </p>
    </div>
  );
}

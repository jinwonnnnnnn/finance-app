import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import Navbar from '../../components/layout/Navbar';

const CATEGORIES = [
  { key: 'general', label: '전체' },
  { key: 'forex', label: '외환' },
  { key: 'crypto', label: '암호화폐' },
  { key: 'merger', label: 'M&A' },
];

function timeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp * 1000) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function NewsCard({ item, index }: { item: any; index: number }) {
  const [imgError, setImgError] = useState(false);
  const tickers = item.related
    ? item.related.split(',').filter(Boolean).slice(0, 3)
    : [];

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group flex gap-4 bg-[#111318] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-indigo-950/10 rounded-2xl p-4 transition-all"
    >
      {/* 썸네일 */}
      {item.image && !imgError ? (
        <img
          src={item.image}
          alt=""
          onError={() => setImgError(true)}
          className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-white/[0.04]"
        />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-white/[0.04] flex-shrink-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
          </svg>
        </div>
      )}

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
            {item.source}
          </span>
          <span className="text-[10px] text-slate-600">{timeAgo(item.datetime)}</span>
        </div>

        <h3 className="text-[13px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-indigo-200 transition">
          {item.headline}
        </h3>

        {item.summary && (
          <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {item.summary}
          </p>
        )}

        {/* 관련 종목 태그 */}
        {tickers.length > 0 && (
          <div className="flex gap-1 mt-2">
            {tickers.map((t: string) => (
              <span
                key={t}
                className="text-[10px] text-slate-400 bg-white/[0.04] border border-white/[0.07] rounded px-1.5 py-0.5 font-mono"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 외부 링크 아이콘 */}
      <div className="flex-shrink-0 self-start mt-1">
        <svg className="w-3.5 h-3.5 text-slate-700 group-hover:text-indigo-400 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </div>
    </motion.a>
  );
}

export default function NewsPage() {
  const [category, setCategory] = useState('general');

  const { data: news = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['news', category],
    queryFn: () => api.get('/news', { params: { category } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });

  return (
    <div className="min-h-screen bg-[#08090d]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-20 pb-24 md:pb-10">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5 mt-2">
          <div>
            <h1 className="text-xl font-bold text-white">글로벌 뉴스</h1>
            <p className="text-slate-500 text-xs mt-0.5">세계 시장 주요 소식</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            새로고침
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 뉴스 목록 */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111318] border border-white/[0.06] rounded-2xl p-4 flex gap-4 animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-white/[0.04] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/[0.04] rounded w-1/3" />
                  <div className="h-4 bg-white/[0.04] rounded w-full" />
                  <div className="h-4 bg-white/[0.04] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
            <p className="text-sm">뉴스를 가져오는 중 오류가 발생했습니다</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {news.map((item: any, i: number) => (
              <NewsCard key={item.id ?? i} item={item} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Vercel 서버리스 프록시 — Railway IP가 Yahoo Finance에 차단/타임아웃되므로
// Vercel IP를 통해 chart와 search 두 엔드포인트를 중계한다.
export const config = { runtime: 'nodejs' };

const YF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://finance.yahoo.com/',
};

export default async function handler(req: any, res: any) {
  const { type, symbol, interval = '1d', range = '1mo', q, quotesCount = '15' } = req.query;

  let url: string;

  if (type === 'search') {
    if (!q) return res.status(400).json({ error: 'q required' });
    url =
      `https://query2.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(q)}&quotesCount=${quotesCount}&newsCount=0&enableFuzzyQuery=false`;
  } else {
    if (!symbol) return res.status(400).json({ error: 'symbol required' });
    url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
      `?interval=${interval}&range=${range}`;
  }

  try {
    const yfRes = await fetch(url, { headers: YF_HEADERS });
    const data = await yfRes.json();
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e?.message ?? 'proxy error' });
  }
}

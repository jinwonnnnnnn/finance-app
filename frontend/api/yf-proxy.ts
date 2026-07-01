// Vercel 서버리스 프록시 — Railway IP는 Yahoo Finance 차트 엔드포인트에 차단되므로
// Vercel IP를 통해 중계한다. Vercel 함수는 리라이트보다 우선 실행됨.
export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  const { symbol, interval = '1d', range = '1mo' } = req.query;

  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?interval=${interval}&range=${range}`;

  try {
    const yfRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://finance.yahoo.com/',
      },
    });
    const data = await yfRes.json();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e?.message ?? 'proxy error' });
  }
}

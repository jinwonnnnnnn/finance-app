// Vercel 서버리스 프록시 — repo 루트 api/ (outputDirectory 무관하게 Vercel이 반드시 인식)
// Railway IP → Yahoo Finance 차단 우회 + crumb 인증으로 v8 API 404 해결
export const config = { runtime: 'nodejs' };

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const BASE_HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://finance.yahoo.com/',
};

// 모듈 레벨 캐시 — warm 인스턴스 재사용 (cold start 시 재취득)
let sessionCache: { crumb: string; cookie: string; expiry: number } | null = null;

async function getSession(): Promise<{ crumb: string; cookie: string } | null> {
  if (sessionCache && Date.now() < sessionCache.expiry) return sessionCache;

  try {
    // 1단계: Yahoo Finance 세션 쿠키 취득
    const r1 = await fetch('https://fc.yahoo.com/', {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
    });
    const cookie1 = parseCookies(r1.headers.get('set-cookie') ?? '');

    // 2단계: crumb 취득
    const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...BASE_HEADERS, Cookie: cookie1 },
    });
    const crumb = (await r2.text()).trim();
    if (!crumb || crumb.startsWith('<') || crumb.length > 20) return null;

    const cookie2 = parseCookies(r2.headers.get('set-cookie') ?? '');
    const fullCookie = [cookie1, cookie2].filter(Boolean).join('; ');

    sessionCache = { crumb, cookie: fullCookie, expiry: Date.now() + 3600_000 };
    return sessionCache;
  } catch {
    return null;
  }
}

function parseCookies(raw: string): string {
  return raw
    .split(',')
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

export default async function handler(req: any, res: any) {
  const {
    type,
    symbol,
    interval = '1d',
    range = '1mo',
    q,
    quotesCount = '15',
  } = req.query;

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
    const session = await getSession();

    // crumb이 있으면 URL에 추가
    if (session?.crumb && type !== 'search') {
      url += `&crumb=${encodeURIComponent(session.crumb)}`;
    }

    const reqHeaders: Record<string, string> = { ...BASE_HEADERS };
    if (session?.cookie) reqHeaders['Cookie'] = session.cookie;

    const yfRes = await fetch(url, { headers: reqHeaders });
    const data = await yfRes.json();

    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e?.message ?? 'proxy error' });
  }
}

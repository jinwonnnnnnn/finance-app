import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const YF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Referer: 'https://finance.yahoo.com/',
  Origin: 'https://finance.yahoo.com',
};

// Yahoo Finance cookie + crumb 세션 캐시 (55분 TTL)
const yfSession = {
  cookie: '',
  crumb: '',
  expires: 0,
  refreshing: false,

  async ensureValid(logger: Logger) {
    if (this.crumb && Date.now() < this.expires) return;
    if (this.refreshing) {
      await new Promise((r) => setTimeout(r, 2000));
      return;
    }
    this.refreshing = true;
    try {
      // Step 1: consent cookie
      const r1 = await axios.get('https://fc.yahoo.com/', {
        headers: YF_HEADERS,
        timeout: 8000,
        maxRedirects: 5,
        validateStatus: () => true,
      });
      const setCookies = (r1.headers['set-cookie'] ?? []) as string[];
      this.cookie = setCookies.map((c: string) => c.split(';')[0]).join('; ');

      // Step 2: crumb
      const r2 = await axios.get('https://query2.finance.yahoo.com/v1/test/getcrumb', {
        headers: { ...YF_HEADERS, Cookie: this.cookie },
        timeout: 8000,
        validateStatus: () => true,
      });
      if (r2.status === 200 && typeof r2.data === 'string' && r2.data.length > 0) {
        this.crumb = r2.data;
        this.expires = Date.now() + 55 * 60 * 1000;
        logger.log(`YF session refreshed, crumb=${this.crumb.slice(0, 8)}...`);
      } else {
        logger.warn(`YF crumb fetch failed: status=${r2.status}`);
      }
    } catch (e: any) {
      logger.warn(`YF session refresh error: ${e?.message ?? e}`);
    } finally {
      this.refreshing = false;
    }
  },

  headers(): Record<string, string> {
    return this.cookie ? { ...YF_HEADERS, Cookie: this.cookie } : YF_HEADERS;
  },
};

function toYahooSymbol(symbol: string): string {
  if (/^\d{6}$/.test(symbol)) return `${symbol}.KS`;
  return symbol;
}

function errMsg(e: any): string {
  const status = e?.response?.status ? `HTTP${e.response.status} ` : '';
  return status + (e?.message || e?.code || 'unknown');
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private config: ConfigService) {}

  private get token() {
    return this.config.get<string>('FINNHUB_TOKEN');
  }

  // ── 검색 ──────────────────────────────────────────────────────────────────

  async searchSymbol(query: string, market = 'US') {
    if (market === 'KR') return this.searchYahoo(query, true);
    return this.searchFinnhub(query);
  }

  private async searchFinnhub(query: string) {
    try {
      const { data } = await axios.get('https://finnhub.io/api/v1/search', {
        params: { q: query, token: this.token },
        timeout: 8000,
      });
      return (data.result ?? [])
        .filter((r: any) => r.type === 'Common Stock' && !r.symbol.includes('.'))
        .slice(0, 10)
        .map((r: any) => ({ symbol: r.symbol, description: r.description, type: r.type }));
    } catch (e: any) {
      this.logger.error(`searchFinnhub error: ${errMsg(e)}`);
      return [];
    }
  }

  private async searchYahoo(query: string, krOnly = false) {
    try {
      await yfSession.ensureValid(this.logger);
      const { data } = await axios.get('https://query2.finance.yahoo.com/v1/finance/search', {
        params: { q: query, quotesCount: 15, newsCount: 0, enableFuzzyQuery: false, crumb: yfSession.crumb },
        headers: yfSession.headers(),
        timeout: 8000,
      });
      const quotes: any[] = data?.quotes ?? [];
      const filtered = krOnly
        ? quotes.filter(
            (q) =>
              ['KSC', 'KOE', 'KSE', 'KSX'].includes(q.exchange) ||
              (q.symbol && /^\d{6}\.(KS|KQ)$/.test(q.symbol)),
          )
        : quotes;
      return filtered.slice(0, 10).map((q) => ({
        symbol: q.symbol?.replace(/\.(KS|KQ)$/, '') ?? q.symbol,
        description: q.displayName ?? q.longname ?? q.shortname ?? q.symbol,
        type: q.quoteType,
      }));
    } catch (e: any) {
      this.logger.error(`searchYahoo error: ${errMsg(e)}`);
      return [];
    }
  }

  // ── 현재가 ─────────────────────────────────────────────────────────────────

  async getQuote(symbol: string, market = 'US') {
    if (market === 'KR' || /^\d{6}$/.test(symbol)) return this.getQuoteYahoo(symbol);
    return this.getQuoteFinnhub(symbol);
  }

  private async getQuoteFinnhub(symbol: string) {
    try {
      const { data } = await axios.get('https://finnhub.io/api/v1/quote', {
        params: { symbol, token: this.token },
        timeout: 8000,
      });
      return {
        symbol,
        current: data.c ?? 0,
        high: data.h ?? 0,
        low: data.l ?? 0,
        open: data.o ?? 0,
        prevClose: data.pc ?? 0,
        change: (data.c ?? 0) - (data.pc ?? 0),
        changePercent: data.dp ?? 0,
      };
    } catch (e: any) {
      this.logger.error(`getQuoteFinnhub error: ${symbol}: ${errMsg(e)}`);
      return { symbol, current: 0, high: 0, low: 0, open: 0, prevClose: 0, change: 0, changePercent: 0 };
    }
  }

  private async getQuoteYahoo(symbol: string) {
    const yahooSymbol = toYahooSymbol(symbol);
    try {
      await yfSession.ensureValid(this.logger);
      const { data } = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
        {
          params: { interval: '1d', range: '1d', crumb: yfSession.crumb },
          headers: yfSession.headers(),
          timeout: 10000,
        },
      );
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) {
        this.logger.warn(`getQuoteYahoo: no meta for ${yahooSymbol}`);
        return { symbol, current: 0, high: 0, low: 0, open: 0, prevClose: 0, change: 0, changePercent: 0 };
      }
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? 0;
      const current = meta.regularMarketPrice ?? prev;
      const change = current - prev;
      const changePercent = prev ? (change / prev) * 100 : 0;
      this.logger.log(`getQuoteYahoo ${yahooSymbol}: ₩${current}`);
      return {
        symbol,
        current,
        high: meta.regularMarketDayHigh ?? current,
        low: meta.regularMarketDayLow ?? current,
        open: meta.regularMarketOpen ?? current,
        prevClose: prev,
        change,
        changePercent,
      };
    } catch (e: any) {
      this.logger.error(`getQuoteYahoo error: ${yahooSymbol}: ${errMsg(e)}`);
      // 세션 만료 가능성 → 강제 초기화
      if ((e?.response?.status === 401 || e?.response?.status === 403)) {
        yfSession.expires = 0;
      }
      return { symbol, current: 0, high: 0, low: 0, open: 0, prevClose: 0, change: 0, changePercent: 0 };
    }
  }

  // ── 차트(캔들) ─────────────────────────────────────────────────────────────

  async getCandles(symbol: string, resolution: string, from: number, to: number, _market = 'US') {
    return this.getCandlesYahoo(symbol, resolution, from, to);
  }

  private async getCandlesYahoo(symbol: string, resolution: string, from: number, to: number) {
    const yahooSymbol = toYahooSymbol(symbol);
    const intervalMap: Record<string, string> = {
      '1': '1m', '5': '5m', '15': '15m', '60': '60m',
      'D': '1d', 'W': '1wk', 'M': '1mo',
    };
    const interval = intervalMap[resolution] ?? '1d';
    try {
      await yfSession.ensureValid(this.logger);
      const { data } = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
        {
          params: { interval, period1: from, period2: to, crumb: yfSession.crumb },
          headers: yfSession.headers(),
          timeout: 12000,
        },
      );
      const result = data?.chart?.result?.[0];
      if (!result) return [];
      const timestamps: number[] = result.timestamp ?? [];
      const ohlcv = result.indicators?.quote?.[0] ?? {};
      const candles = timestamps
        .map((t, i) => ({
          time: t,
          open: ohlcv.open?.[i] ?? null,
          high: ohlcv.high?.[i] ?? null,
          low: ohlcv.low?.[i] ?? null,
          close: ohlcv.close?.[i] ?? null,
          volume: ohlcv.volume?.[i] ?? null,
        }))
        .filter((c) => c.close != null);
      this.logger.log(`getCandlesYahoo ${yahooSymbol}: ${candles.length} candles`);
      return candles;
    } catch (e: any) {
      this.logger.error(`getCandlesYahoo error: ${yahooSymbol}: ${errMsg(e)}`);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        yfSession.expires = 0;
      }
      return [];
    }
  }

  // ── 뉴스 ──────────────────────────────────────────────────────────────────

  async getFinnhubNews(_symbols: string[]) {
    try {
      const { data } = await axios.get('https://finnhub.io/api/v1/news', {
        params: { category: 'general', token: this.token },
      });
      return (data ?? []).slice(0, 5);
    } catch {
      return [];
    }
  }
}

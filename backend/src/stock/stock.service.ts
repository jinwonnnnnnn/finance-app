import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const YF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://finance.yahoo.com/',
};

// Railway IP → Yahoo Finance 차트 차단 우회: Vercel 프록시 경유
// VERCEL_PROXY 환경변수: https://finance-app-jw.vercel.app/api/yf-proxy
const YF_PROXY = process.env.VERCEL_PROXY ?? '';

function toYahooSymbol(symbol: string): string {
  if (/^\d{6}$/.test(symbol)) return `${symbol}.KS`;
  return symbol;
}

// 날짜 범위(일수) → Yahoo Finance range 파라미터
// range 파라미터는 period1/period2와 달리 crumb 불필요
function daysToRange(days: number): { range: string; interval: string } {
  if (days <= 2)   return { range: '1d',  interval: '5m'  };
  if (days <= 7)   return { range: '5d',  interval: '30m' };
  if (days <= 35)  return { range: '1mo', interval: '1d'  };
  if (days <= 95)  return { range: '3mo', interval: '1d'  };
  if (days <= 370) return { range: '1y',  interval: '1wk' };
  return               { range: '5y',  interval: '1mo' };
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
      const { data } = await axios.get('https://query2.finance.yahoo.com/v1/finance/search', {
        params: { q: query, quotesCount: 15, newsCount: 0, enableFuzzyQuery: false },
        headers: YF_HEADERS,
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

  private async fetchYFChart(yahooSymbol: string, interval: string, range: string) {
    if (YF_PROXY) {
      const { data } = await axios.get(YF_PROXY, {
        params: { symbol: yahooSymbol, interval, range },
        timeout: 12000,
      });
      return data;
    }
    const { data } = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
      { params: { interval, range }, headers: YF_HEADERS, timeout: 12000 },
    );
    return data;
  }

  private async getQuoteYahoo(symbol: string) {
    const yahooSymbol = toYahooSymbol(symbol);
    try {
      const data = await this.fetchYFChart(yahooSymbol, '1d', '1d');
      const result = data?.chart?.result?.[0];
      if (!result) {
        this.logger.warn(`getQuoteYahoo: no result for ${yahooSymbol} (${data?.chart?.error?.code ?? 'unknown'})`);
        return { symbol, current: 0, high: 0, low: 0, open: 0, prevClose: 0, change: 0, changePercent: 0 };
      }
      const meta = result.meta;
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? 0;
      const cur = meta.regularMarketPrice ?? prev;
      const change = cur - prev;
      const changePercent = prev ? (change / prev) * 100 : 0;
      this.logger.log(`getQuoteYahoo ${yahooSymbol}: ${cur}`);
      return {
        symbol, current: cur,
        high: meta.regularMarketDayHigh ?? cur,
        low: meta.regularMarketDayLow ?? cur,
        open: meta.regularMarketOpen ?? cur,
        prevClose: prev, change, changePercent,
      };
    } catch (e: any) {
      this.logger.error(`getQuoteYahoo error: ${yahooSymbol}: ${errMsg(e)}`);
      return { symbol, current: 0, high: 0, low: 0, open: 0, prevClose: 0, change: 0, changePercent: 0 };
    }
  }

  // ── 차트(캔들) ─────────────────────────────────────────────────────────────

  async getCandles(symbol: string, resolution: string, from: number, to: number, _market = 'US') {
    return this.getCandlesYahoo(symbol, resolution, from, to);
  }

  private async getCandlesYahoo(symbol: string, resolution: string, from: number, to: number) {
    const yahooSymbol = toYahooSymbol(symbol);
    const days = Math.max(1, Math.round((to - from) / 86400));
    const { range, interval } = daysToRange(days);

    try {
      const data = await this.fetchYFChart(yahooSymbol, interval, range);
      const result = data?.chart?.result?.[0];
      if (!result) {
        const errCode = data?.chart?.error?.code ?? 'no result';
        this.logger.warn(`getCandlesYahoo: ${yahooSymbol} ${errCode}`);
        return [];
      }
      const timestamps: number[] = result.timestamp ?? [];
      const ohlcv = result.indicators?.quote?.[0] ?? {};
      const candles = timestamps
        .map((t, i) => ({
          time: t,
          open:   ohlcv.open?.[i]   ?? null,
          high:   ohlcv.high?.[i]   ?? null,
          low:    ohlcv.low?.[i]    ?? null,
          close:  ohlcv.close?.[i]  ?? null,
          volume: ohlcv.volume?.[i] ?? null,
        }))
        .filter((c) => c.close != null);
      this.logger.log(`getCandlesYahoo ${yahooSymbol} (${range}/${interval}): ${candles.length} candles`);
      return candles;
    } catch (e: any) {
      this.logger.error(`getCandlesYahoo error: ${yahooSymbol}: ${errMsg(e)}`);
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

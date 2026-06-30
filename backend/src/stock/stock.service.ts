import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

function toYahooSymbol(symbol: string): string {
  if (/^\d{6}$/.test(symbol)) return `${symbol}.KS`;
  return symbol;
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  private readonly yf = new (require('yahoo-finance2').default)();

  constructor(private config: ConfigService) {}

  private get token() {
    return this.config.get<string>('FINNHUB_TOKEN');
  }

  async searchSymbol(query: string, market = 'US') {
    if (market === 'KR') return this.searchYahooKR(query);
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
    } catch (e) {
      this.logger.error('searchFinnhub error', e);
      return [];
    }
  }

  private async searchYahooKR(query: string) {
    try {
      const results = await this.yf.search(query, {}, { validateResult: false });
      this.logger.debug(`searchYahooKR raw count: ${(results.quotes ?? []).length}`);
      const quotes = (results.quotes ?? []).filter(
        (q: any) => ['KSC', 'KOE', 'KSE'].includes(q.exchange) ||
          (q.symbol && /^\d{6}\.(KS|KQ)$/.test(q.symbol)),
      );
      return quotes.slice(0, 10).map((q: any) => ({
        symbol: q.symbol?.replace(/\.(KS|KQ)$/, ''),
        description: q.shortname ?? q.longname ?? q.symbol,
        type: q.quoteType,
      }));
    } catch (e) {
      this.logger.error('searchYahooKR error', e);
      return [];
    }
  }

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
    } catch (e) {
      this.logger.error(`getQuoteFinnhub error: ${symbol}`, e);
      return { symbol, current: 0, high: 0, low: 0, open: 0, prevClose: 0, change: 0, changePercent: 0 };
    }
  }

  private async getQuoteYahoo(symbol: string) {
    try {
      const yahooSymbol = toYahooSymbol(symbol);
      const data = await this.yf.quote(yahooSymbol, {}, { validateResult: false });
      return {
        symbol,
        current: data.regularMarketPrice ?? 0,
        high: data.regularMarketDayHigh ?? 0,
        low: data.regularMarketDayLow ?? 0,
        open: data.regularMarketOpen ?? 0,
        prevClose: data.regularMarketPreviousClose ?? 0,
        change: data.regularMarketChange ?? 0,
        changePercent: data.regularMarketChangePercent ?? 0,
      };
    } catch (e) {
      this.logger.error(`getQuoteYahoo error: ${symbol}`, e);
      return { symbol, current: 0, high: 0, low: 0, open: 0, prevClose: 0, change: 0, changePercent: 0 };
    }
  }

  async getCandles(symbol: string, resolution: string, from: number, to: number, market = 'US') {
    if (market === 'KR' || /^\d{6}$/.test(symbol)) return this.getCandlesYahoo(symbol, resolution, from, to);
    return this.getCandlesFinnhub(symbol, resolution, from, to);
  }

  private async getCandlesFinnhub(symbol: string, resolution: string, from: number, to: number) {
    try {
      const { data } = await axios.get('https://finnhub.io/api/v1/stock/candle', {
        params: { symbol, resolution, from, to, token: this.token },
        timeout: 10000,
      });
      if (data.s !== 'ok' || !data.t) return [];
      return data.t.map((t: number, i: number) => ({
        time: t,
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i],
      }));
    } catch (e) {
      this.logger.error(`getCandlesFinnhub error: ${symbol}`, e);
      return [];
    }
  }

  private async getCandlesYahoo(symbol: string, resolution: string, from: number, to: number) {
    try {
      const yahooSymbol = toYahooSymbol(symbol);
      const intervalMap: Record<string, '1d' | '1wk' | '1mo' | '60m' | '5m'> = {
        '5': '5m', '60': '60m', 'D': '1d', 'W': '1wk', 'M': '1mo',
      };
      const interval = intervalMap[resolution] ?? '1d';
      const data = await this.yf.chart(yahooSymbol, {
        period1: new Date(from * 1000),
        period2: new Date(to * 1000),
        interval,
      }, { validateResult: false });

      return (data.quotes ?? [])
        .filter((q: any) => q.close != null)
        .map((q: any) => ({
          time: Math.floor(new Date(q.date).getTime() / 1000),
          open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume,
        }));
    } catch (e) {
      this.logger.error(`getCandlesYahoo error: ${symbol}`, e);
      return [];
    }
  }

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

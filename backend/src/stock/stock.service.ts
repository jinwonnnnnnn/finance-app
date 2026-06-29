import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yahooFinance = require('yahoo-finance2').default;

const KR_SUFFIX: Record<string, string> = {};

function toYahooSymbol(symbol: string, market: string): string {
  if (market === 'KR' || /^\d{6}$/.test(symbol)) return `${symbol}.KS`;
  return symbol;
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private config: ConfigService) {}

  async searchSymbol(query: string, market = 'US') {
    try {
      const results = await yahooFinance.search(query, {}, { validateResult: false });
      const quotes = (results.quotes ?? []).filter((q: any) =>
        market === 'KR'
          ? q.exchange === 'KSC' || q.exchange === 'KOE'
          : q.quoteType === 'EQUITY' && !q.symbol?.endsWith('.KS'),
      );
      return quotes.slice(0, 10).map((q: any) => ({
        symbol: market === 'KR' ? q.symbol?.replace('.KS', '') : q.symbol,
        description: q.shortname ?? q.longname ?? q.symbol,
        type: q.quoteType,
      }));
    } catch (e) {
      this.logger.error('searchSymbol error', e);
      return [];
    }
  }

  async getQuote(symbol: string, market = 'US') {
    try {
      const yahooSymbol = toYahooSymbol(symbol, market);
      const data = await yahooFinance.quote(yahooSymbol, {}, { validateResult: false });
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
      this.logger.error(`getQuote error: ${symbol}`, e);
      return { symbol, current: 0, high: 0, low: 0, open: 0, prevClose: 0, change: 0, changePercent: 0 };
    }
  }

  async getCandles(symbol: string, resolution: string, from: number, to: number, market = 'US') {
    try {
      const yahooSymbol = toYahooSymbol(symbol, market);
      const intervalMap: Record<string, '1d' | '1wk' | '1mo' | '60m' | '5m'> = {
        '5': '5m', '60': '60m', 'D': '1d', 'W': '1wk', 'M': '1mo',
      };
      const interval = intervalMap[resolution] ?? '1d';
      const data = await yahooFinance.chart(yahooSymbol, {
        period1: new Date(from * 1000),
        period2: new Date(to * 1000),
        interval,
      }, { validateResult: false });

      const quotes = data.quotes ?? [];
      return quotes
        .filter((q: any) => q.close != null)
        .map((q: any) => ({
          time: Math.floor(new Date(q.date).getTime() / 1000),
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          volume: q.volume,
        }));
    } catch (e) {
      this.logger.error(`getCandles error: ${symbol}`, e);
      return [];
    }
  }

  async getFinnhubNews(symbols: string[]) {
    try {
      const token = this.config.get('FINNHUB_TOKEN');
      const { data } = await axios.get('https://finnhub.io/api/v1/news', {
        params: { category: 'general', token },
      });
      return (data ?? []).slice(0, 5);
    } catch {
      return [];
    }
  }
}

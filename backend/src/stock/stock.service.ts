import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private config: ConfigService) {}

  async searchSymbol(query: string) {
    const token = this.config.get('FINNHUB_TOKEN');
    const { data } = await axios.get('https://finnhub.io/api/v1/search', {
      params: { q: query, token },
    });
    return (data.result ?? []).slice(0, 10).map((r: any) => ({
      symbol: r.symbol,
      description: r.description,
      type: r.type,
    }));
  }

  async getQuote(symbol: string) {
    const token = this.config.get('FINNHUB_TOKEN');
    const { data } = await axios.get('https://finnhub.io/api/v1/quote', {
      params: { symbol, token },
    });
    return {
      symbol,
      current: data.c,
      high: data.h,
      low: data.l,
      open: data.o,
      prevClose: data.pc,
      change: data.d,
      changePercent: data.dp,
    };
  }

  async getCandles(symbol: string, resolution: string, from: number, to: number) {
    const token = this.config.get('FINNHUB_TOKEN');
    const { data } = await axios.get('https://finnhub.io/api/v1/stock/candle', {
      params: { symbol, resolution, from, to, token },
    });
    if (data.s !== 'ok') return [];
    return data.t.map((t: number, i: number) => ({
      time: t,
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }));
  }
}

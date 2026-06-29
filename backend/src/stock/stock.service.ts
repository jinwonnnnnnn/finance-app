import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * 한국 종목코드(6자리 숫자)를 Yahoo Finance 심볼로 변환
 * 예: '005930' → '005930.KS' (삼성전자)
 */
function toYahooSymbol(symbol: string, market: string): string {
  if (market === 'KR' || /^\d{6}$/.test(symbol)) return `${symbol}.KS`;
  return symbol;
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  // yahoo-finance2 v3: 싱글톤 대신 인스턴스 패턴으로 변경됨
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  private readonly yf = new (require('yahoo-finance2').YahooFinance)();

  constructor(private config: ConfigService) {}

  /**
   * 종목 검색
   * - US: 'Apple' → [{ symbol: 'AAPL', description: 'Apple Inc.' }]
   * - KR: '삼성' → [{ symbol: '005930', description: '삼성전자' }]
   */
  async searchSymbol(query: string, market = 'US') {
    try {
      const results = await this.yf.search(query, {}, { validateResult: false });
      // 시장별 거래소 필터링 (KSC/KOE = 한국거래소/코스닥)
      const quotes = (results.quotes ?? []).filter((q: any) =>
        market === 'KR'
          ? q.exchange === 'KSC' || q.exchange === 'KOE'
          : q.quoteType === 'EQUITY' && !q.symbol?.endsWith('.KS'),
      );
      return quotes.slice(0, 10).map((q: any) => ({
        // KR: Yahoo 심볼에서 .KS 제거해서 6자리 코드만 반환
        symbol: market === 'KR' ? q.symbol?.replace('.KS', '') : q.symbol,
        description: q.shortname ?? q.longname ?? q.symbol,
        type: q.quoteType,
      }));
    } catch (e) {
      this.logger.error('searchSymbol error', e);
      return [];
    }
  }

  /**
   * 현재 시세 조회 (30초마다 프론트에서 자동 갱신)
   * regularMarketPrice = 현재가, regularMarketChangePercent = 등락률(%)
   */
  async getQuote(symbol: string, market = 'US') {
    try {
      const yahooSymbol = toYahooSymbol(symbol, market);
      const data = await this.yf.quote(yahooSymbol, {}, { validateResult: false });
      return {
        symbol,
        current: data.regularMarketPrice ?? 0,
        high: data.regularMarketDayHigh ?? 0,
        low: data.regularMarketDayLow ?? 0,
        open: data.regularMarketOpen ?? 0,
        prevClose: data.regularMarketPreviousClose ?? 0,
        change: data.regularMarketChange ?? 0,          // 전일 대비 변동액
        changePercent: data.regularMarketChangePercent ?? 0, // 전일 대비 변동률(%)
      };
    } catch (e) {
      this.logger.error(`getQuote error: ${symbol}`, e);
      // 오류 시 0으로 채워 반환 (프론트에서 '—' 표시)
      return { symbol, current: 0, high: 0, low: 0, open: 0, prevClose: 0, change: 0, changePercent: 0 };
    }
  }

  /**
   * 차트 캔들 데이터 조회
   * resolution: '5'=5분봉, '60'=1시간봉, 'D'=일봉, 'W'=주봉, 'M'=월봉
   * from/to: Unix timestamp (초 단위)
   */
  async getCandles(symbol: string, resolution: string, from: number, to: number, market = 'US') {
    try {
      const yahooSymbol = toYahooSymbol(symbol, market);
      // Finnhub resolution 코드 → Yahoo Finance interval 변환
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
        .filter((q: any) => q.close != null) // 데이터 없는 날(공휴일 등) 제외
        .map((q: any) => ({
          time: Math.floor(new Date(q.date).getTime() / 1000), // Unix timestamp로 변환
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

  /**
   * Finnhub에서 글로벌 경제 뉴스 가져오기
   * AI 투자 제안 생성 시 시장 컨텍스트로 활용됨
   */
  async getFinnhubNews(_symbols: string[]) {
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

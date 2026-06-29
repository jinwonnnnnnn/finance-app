import { Controller, Get, Param, Query } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @Get('search')
  search(@Query('q') q: string, @Query('market') market = 'US') {
    return this.stockService.searchSymbol(q, market);
  }

  @Get(':symbol/quote')
  quote(@Param('symbol') symbol: string, @Query('market') market = 'US') {
    return this.stockService.getQuote(symbol, market);
  }

  @Get(':symbol/candles')
  candles(
    @Param('symbol') symbol: string,
    @Query('resolution') resolution: string = 'D',
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('market') market = 'US',
  ) {
    return this.stockService.getCandles(symbol, resolution, Number(from), Number(to), market);
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StockService } from './stock.service';

@Controller('stock')
@UseGuards(AuthGuard('jwt'))
export class StockController {
  constructor(private stockService: StockService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.stockService.searchSymbol(q);
  }

  @Get(':symbol/quote')
  quote(@Param('symbol') symbol: string) {
    return this.stockService.getQuote(symbol);
  }

  @Get(':symbol/candles')
  candles(
    @Param('symbol') symbol: string,
    @Query('resolution') resolution: string = 'D',
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.stockService.getCandles(symbol, resolution, Number(from), Number(to));
  }
}

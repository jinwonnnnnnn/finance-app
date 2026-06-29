import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WatchlistService } from './watchlist.service';

@Controller('watchlist')
@UseGuards(AuthGuard('jwt'))
export class WatchlistController {
  constructor(private watchlistService: WatchlistService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.watchlistService.findAll(req.user.id);
  }

  @Post()
  add(@Req() req: any, @Body() body: { symbol: string; name: string; market: string }) {
    return this.watchlistService.add(req.user.id, body.symbol, body.name, body.market);
  }

  @Delete(':symbol')
  remove(@Req() req: any, @Param('symbol') symbol: string) {
    return this.watchlistService.remove(req.user.id, symbol);
  }
}

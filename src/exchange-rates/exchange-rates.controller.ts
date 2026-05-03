import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard)
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get('current')
  async getCurrent() {
    const { rate, fetchedAt } = await this.exchangeRatesService.getCurrentRate();
    return { usdToKrw: rate, fetchedAt };
  }

  @Get('by-date')
  async getByDate(@Query('date') date: string) {
    const { rate, source } = await this.exchangeRatesService.getRateByDate(date);
    return { usdToKrw: rate, source };
  }

  /** 관리자: DB 저장 환율 목록 */
  @Get()
  @UseGuards(AdminGuard)
  async findAll(@Query('limit') limit?: string) {
    return this.exchangeRatesService.findAll(limit ? parseInt(limit) : 60);
  }

  /** 관리자: 특정 날짜 환율 수동 저장/수정 */
  @Put(':date')
  @UseGuards(AdminGuard)
  async upsertByDate(
    @Param('date') date: string,
    @Body('usdToKrw') usdToKrw: number,
  ) {
    return this.exchangeRatesService.upsertByDate(date, usdToKrw);
  }
}

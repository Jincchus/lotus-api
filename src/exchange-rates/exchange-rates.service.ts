import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ExchangeRate } from './exchange-rate.entity';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly rateRepo: Repository<ExchangeRate>,
    private readonly config: ConfigService,
  ) {}

  // ── 공개 API ────────────────────────────────────────────

  /** 오늘 환율 반환 (DB 우선 → API fallback) */
  async getUsdToKrw(): Promise<number> {
    const today = this.today();
    const row = await this.rateRepo.findOneBy({ date: today });
    if (row) return this.parse(row.usdToKrw);

    const rate = await this.fetchFromApi();
    await this.upsert(today, rate);
    return rate;
  }

  /** GET /exchange-rates/current 응답용 */
  async getCurrentRate(): Promise<{ rate: number; fetchedAt: Date }> {
    const rate = await this.getUsdToKrw();
    return { rate, fetchedAt: new Date() };
  }

  /**
   * 날짜 기준 환율 조회
   * 1) 해당 날짜 DB에 있으면 반환
   * 2) 없으면 가장 가까운 이전 날짜 반환
   * 3) 이전 데이터도 없으면 현재 환율 API 반환
   */
  async getRateByDate(date: string): Promise<{ rate: number; source: 'db' | 'current' }> {
    const exact = await this.rateRepo.findOneBy({ date });
    if (exact) return { rate: this.parse(exact.usdToKrw), source: 'db' };

    const prev = await this.rateRepo
      .createQueryBuilder('er')
      .where('er.date < :date', { date })
      .orderBy('er.date', 'DESC')
      .getOne();
    if (prev) return { rate: this.parse(prev.usdToKrw), source: 'db' };

    const rate = await this.getUsdToKrw();
    return { rate, source: 'current' };
  }

  /** 관리자: 날짜별 환율 수동 저장 (덮어쓰기 허용) */
  async upsertByDate(date: string, usdToKrw: number): Promise<ExchangeRate> {
    return this.upsert(date, usdToKrw);
  }

  // ── Cron ────────────────────────────────────────────────

  /** 매일 00:05 오늘 환율 insert (이미 있으면 skip) */
  @Cron('5 0 * * *')
  async upsertTodayRate(): Promise<void> {
    const today = this.today();
    const existing = await this.rateRepo.findOneBy({ date: today });
    if (existing) return;

    try {
      const rate = await this.fetchFromApi();
      await this.upsert(today, rate);
      this.logger.log(`환율 저장 완료: ${today} = ${rate}`);
    } catch (err) {
      this.logger.error('일일 환율 저장 실패', err);
    }
  }

  // ── 내부 유틸 ────────────────────────────────────────────

  private async fetchFromApi(): Promise<number> {
    const apiKey = this.config.get<string>('exchangeRate.apiKey');
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/KRW`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`ExchangeRate API error: ${res.status}`);
      const data = (await res.json()) as { conversion_rate: number };
      return data.conversion_rate;
    } catch (err) {
      this.logger.error('ExchangeRate API fetch failed', err);
      // API 실패 시 가장 최근 DB 값으로 fallback
      const fallback = await this.rateRepo.findOne({
        order: { date: 'DESC' },
      });
      if (fallback) return this.parse(fallback.usdToKrw);
      throw err;
    }
  }

  private async upsert(date: string, rate: number): Promise<ExchangeRate> {
    const existing = await this.rateRepo.findOneBy({ date });
    if (existing) {
      existing.usdToKrw = rate;
      return this.rateRepo.save(existing);
    }
    return this.rateRepo.save(this.rateRepo.create({ date, usdToKrw: rate }));
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private parse(value: number | string): number {
    return typeof value === 'string' ? parseFloat(value) : value;
  }
}

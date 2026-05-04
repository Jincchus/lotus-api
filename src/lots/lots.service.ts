import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lot } from './lot.entity';
import { Broker } from '../brokers/broker.entity';
import { Theme } from '../themes/theme.entity';
import { StocksService } from '../stocks/stocks.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { Currency, Market } from '../stocks/stock.entity';

export interface LotDto {
  id: string;
  symbol: string;
  market: string;
  stockName: string;
  currency: string;
  purchasePrice: number;
  purchaseDate: string;
  initialQuantity: number;
  remainingQuantity: number;
  memo: string | null;
  broker: { id: string; name: string };
  themeId: string | null;
  themeName: string | null;
  appliedStrategyName: string | null;
  currentPrice: number | null;
  returnRate: number | null;
  evaluationAmount: number | null;
  createdAt: Date;
  positionRules?: any[];
  sellHistories?: any[];
}

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(Lot)
    private readonly lotRepo: Repository<Lot>,
    @InjectRepository(Broker)
    private readonly brokerRepo: Repository<Broker>,
    @InjectRepository(Theme)
    private readonly themeRepo: Repository<Theme>,
    private readonly stocksService: StocksService,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  async create(userId: string, dto: CreateLotDto): Promise<Lot> {
    const broker = await this.brokerRepo.findOneBy({ id: dto.brokerId });
    if (!broker) throw new NotFoundException('증권사를 찾을 수 없습니다.');

    const stock = await this.stocksService.findOrCreate(
      dto.symbol,
      dto.market as Market,
    );

    let exchangeRateAtPurchase: number | null = null;
    if (stock.currency === Currency.USD) {
      if (dto.exchangeRateAtPurchase) {
        exchangeRateAtPurchase = dto.exchangeRateAtPurchase;
      } else {
        const { rate } = await this.exchangeRatesService.getRateByDate(dto.purchaseDate);
        exchangeRateAtPurchase = rate;
      }
    }

    let theme: Theme | null = null;
    if (dto.themeId) {
      theme = await this.themeRepo.findOneBy({ id: dto.themeId, user: { id: userId } });
      if (!theme) throw new NotFoundException('테마를 찾을 수 없습니다.');
    }

    const lot = this.lotRepo.create({
      user: { id: userId },
      stock,
      broker,
      theme,
      purchasePrice: dto.purchasePrice,
      purchaseDate: dto.purchaseDate,
      initialQuantity: dto.quantity,
      remainingQuantity: dto.quantity,
      exchangeRateAtPurchase,
      memo: dto.memo ?? null,
    });

    return this.lotRepo.save(lot);
  }

  async findAll(
    userId: string,
    symbol?: string,
    market?: string,
  ): Promise<LotDto[]> {
    const stockWhere: any = {};
    if (symbol) stockWhere.symbol = symbol;
    if (market) stockWhere.market = market;

    const where: any = { user: { id: userId } };
    if (Object.keys(stockWhere).length > 0) where.stock = stockWhere;

    const lots = await this.lotRepo.find({
      where,
      relations: ['stock', 'broker', 'theme', 'positionRules', 'positionRules.sourceStrategy'],
      order: { createdAt: 'DESC' },
    });

    return this.enrichLots(lots);
  }

  async findOne(id: string, userId: string): Promise<LotDto> {
    const lot = await this.lotRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ['stock', 'broker', 'theme', 'positionRules', 'positionRules.sourceStrategy', 'sellHistories'],
    });
    if (!lot) throw new NotFoundException('Lot을 찾을 수 없습니다.');

    const [enriched] = await this.enrichLots([lot]);
    enriched.positionRules = lot.positionRules;
    enriched.sellHistories = lot.sellHistories;
    return enriched;
  }

  async update(id: string, userId: string, dto: UpdateLotDto): Promise<Lot> {
    const lot = await this.lotRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ['broker', 'theme'],
    });
    if (!lot) throw new NotFoundException('Lot을 찾을 수 없습니다.');

    if (dto.purchasePrice !== undefined) lot.purchasePrice = dto.purchasePrice;
    if (dto.purchaseDate !== undefined) lot.purchaseDate = dto.purchaseDate;
    if (dto.memo !== undefined) lot.memo = dto.memo;

    if (dto.initialQuantity !== undefined) {
      const soldQty = Number(lot.initialQuantity) - Number(lot.remainingQuantity);
      if (dto.initialQuantity < soldQty) {
        throw new BadRequestException(
          `초기 수량은 이미 매도된 수량(${soldQty})보다 작을 수 없습니다.`,
        );
      }
      lot.initialQuantity = dto.initialQuantity;
      lot.remainingQuantity = dto.initialQuantity - soldQty;
    }

    if (dto.brokerId !== undefined) {
      const broker = await this.brokerRepo.findOneBy({ id: dto.brokerId });
      if (!broker) throw new NotFoundException('증권사를 찾을 수 없습니다.');
      lot.broker = broker;
    }

    if (dto.themeId !== undefined) {
      if (dto.themeId === null) {
        lot.theme = null;
      } else {
        const theme = await this.themeRepo.findOneBy({ id: dto.themeId, user: { id: userId } });
        if (!theme) throw new NotFoundException('테마를 찾을 수 없습니다.');
        lot.theme = theme;
      }
    }

    return this.lotRepo.save(lot);
  }

  async remove(id: string, userId: string): Promise<void> {
    const lot = await this.lotRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!lot) throw new NotFoundException('Lot을 찾을 수 없습니다.');
    await this.lotRepo.softDelete(id);
  }

  async assertOwner(lotId: string, userId: string): Promise<Lot> {
    const lot = await this.lotRepo.findOne({
      where: { id: lotId, user: { id: userId } },
      relations: ['stock'],
    });
    if (!lot) throw new ForbiddenException('접근 권한이 없습니다.');
    return lot;
  }

  async deductQuantity(lotId: string, quantity: number): Promise<void> {
    const lot = await this.lotRepo.findOneBy({ id: lotId });
    if (!lot) throw new NotFoundException('Lot을 찾을 수 없습니다.');

    const remaining = parseFloat(lot.remainingQuantity as any);
    if (remaining < quantity) {
      throw new BadRequestException(
        `잔여 수량 부족: 잔여 ${remaining}, 요청 ${quantity}`,
      );
    }

    await this.lotRepo.update(lotId, {
      remainingQuantity: remaining - quantity,
    });
  }

  private async enrichLots(lots: Lot[]): Promise<LotDto[]> {
    if (lots.length === 0) return [];

    const targets = lots.map((l) => ({
      symbol: l.stock.symbol,
      market: l.stock.market,
    }));
    const priceMap = await this.stocksService.getMultiplePrices(targets);

    return lots.map((lot) => {
      const purchasePrice = parseFloat(lot.purchasePrice as any);
      const remaining = parseFloat(lot.remainingQuantity as any);
      const priceData = priceMap.get(lot.stock.symbol);
      const currentPrice = priceData?.price ?? null;

      const returnRate =
        currentPrice != null && purchasePrice > 0
          ? parseFloat(
              (((currentPrice - purchasePrice) / purchasePrice) * 100).toFixed(2),
            )
          : null;

      const evaluationAmount =
        currentPrice != null ? currentPrice * remaining : null;

      const activeRules = (lot.positionRules ?? []).filter(
        (r) => !r.isExecuted && r.sourceStrategy,
      );
      const appliedStrategyName = activeRules.length > 0
        ? activeRules[0].sourceStrategy!.name
        : null;

      return {
        id: lot.id,
        symbol: lot.stock.symbol,
        market: lot.stock.market,
        stockName: lot.stock.name,
        currency: lot.stock.currency,
        purchasePrice,
        purchaseDate: lot.purchaseDate,
        initialQuantity: parseFloat(lot.initialQuantity as any),
        remainingQuantity: remaining,
        memo: lot.memo,
        broker: { id: lot.broker.id, name: lot.broker.name },
        themeId: lot.theme?.id ?? null,
        themeName: lot.theme?.name ?? null,
        appliedStrategyName,
        currentPrice,
        returnRate,
        evaluationAmount,
        createdAt: lot.createdAt,
      };
    });
  }
}

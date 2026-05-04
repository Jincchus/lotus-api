import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

import { Type } from 'class-transformer';
import { Market } from '../../stocks/stock.entity';
import { IsNotFutureDate } from '../../common/validators/is-not-future-date.validator';

export class CreateLotDto {
  @IsString()
  @MinLength(1)
  symbol: string;

  @IsEnum(Market)
  market: Market;

  @IsUUID()
  brokerId: string;

  @IsNumber()
  @IsPositive()
  purchasePrice: number;

  @IsDateString()
  @IsNotFutureDate()
  purchaseDate: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  exchangeRateAtPurchase?: number;

  @IsOptional()
  @IsUUID()
  themeId?: string;

  @IsOptional()
  @IsString()
  memo?: string;
}

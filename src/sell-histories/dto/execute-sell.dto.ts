import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { SellType } from '../sell-history.entity';
import { IsNotFutureDate } from '../../common/validators/is-not-future-date.validator';

export class ExecuteSellDto {
  @IsNumber()
  @IsPositive()
  sellPrice: number;

  @IsNumber()
  @IsPositive()
  sellQuantity: number;

  @IsDateString()
  @IsNotFutureDate()
  sellDate: string;

  @IsEnum(SellType)
  sellType: SellType;

  @IsOptional()
  @IsUUID()
  positionRuleId?: string;
}

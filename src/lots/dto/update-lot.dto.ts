import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNotFutureDate } from '../../common/validators/is-not-future-date.validator';

export class UpdateLotDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  purchasePrice?: number;

  @IsOptional()
  @IsDateString()
  @IsNotFutureDate()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  initialQuantity?: number;

  @IsOptional()
  @IsUUID()
  brokerId?: string;

  @IsOptional()
  @IsString()
  memo?: string;
}

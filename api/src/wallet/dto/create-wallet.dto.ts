import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Currency } from 'generated/prisma/enums';

export class CreateWalletDto {
  @ApiProperty({ example: 'My Wallet' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: Currency, default: Currency.ETB })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

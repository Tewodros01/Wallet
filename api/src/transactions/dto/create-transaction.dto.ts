import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  RecurrenceInterval,
  TransactionStatus,
  TransactionType,
} from 'generated/prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ example: 'Salary' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @ApiProperty({ example: 1500.0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  amount!: number;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ example: 'Monthly salary' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'wallet-cuid' })
  @IsString()
  walletId!: string;

  @ApiPropertyOptional({ example: 'category-cuid' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'source-wallet-cuid' })
  @ValidateIf((o: CreateTransactionDto) => o.type === TransactionType.TRANSFER)
  @IsString()
  sourceWalletId?: string;

  @ApiPropertyOptional({ example: 'destination-wallet-cuid' })
  @ValidateIf((o: CreateTransactionDto) => o.type === TransactionType.TRANSFER)
  @IsString()
  destinationWalletId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ enum: RecurrenceInterval })
  @ValidateIf((o: CreateTransactionDto) => o.isRecurring === true)
  @IsEnum(RecurrenceInterval)
  recurrenceInterval?: RecurrenceInterval;

  @ApiPropertyOptional({ example: '2025-01-15T00:00:00.000Z' })
  @ValidateIf((o: CreateTransactionDto) => o.isRecurring === true)
  @IsDateString()
  recurrenceEndsAt?: string;
}

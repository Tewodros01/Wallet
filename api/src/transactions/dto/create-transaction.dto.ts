import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import {
  RecurrenceInterval,
  TransactionStatus,
  TransactionType,
} from 'generated/prisma/enums';

export class CreateTransactionDto {
  @ApiProperty({ example: 'Salary' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;

  @ApiProperty({ example: '2024-01-01T00' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'wallet-id' })
  @IsString()
  walletId!: string;

  @ApiPropertyOptional({ example: 'category-id' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Optional note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsString()
  destinationWalletId?: string;

  @IsEnum(RecurrenceInterval)
  recurrenceInterval?: RecurrenceInterval;

  @IsDateString()
  recurringEndsAt?: string;
}

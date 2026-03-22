import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaymentMethod } from 'generated/prisma/client';

export class CreateDepositDto {
  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(10)
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ example: 'cm123agent0001xyz' })
  @IsString()
  agentId!: string;

  @ApiPropertyOptional({ example: 'TXN-REF-12345' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsString()
  proofUrl?: string;
}

export class CreateWithdrawalDto {
  @ApiProperty({ example: 200 })
  @IsInt()
  @Min(50)
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ example: 'cm123agent0001xyz' })
  @IsString()
  agentId!: string;

  @ApiProperty({ example: '+251912345678' })
  @IsString()
  accountNumber!: string;
}

export class TransferCoinsDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  recipientUsername!: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  amount!: number;
}

export class PlayKenoDto {
  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  bet!: number;

  @ApiProperty({ example: [1, 4, 11, 23, 40] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(80, { each: true })
  picks!: number[];
}

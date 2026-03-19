import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from 'generated/prisma/client';

export class CreateDepositDto {
  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(10)
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

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
  @Min(10)
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ example: '+251912345678' })
  @IsString()
  accountNumber!: string;
}

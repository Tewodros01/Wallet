import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  FinancialAccountProvider,
  Role,
} from 'generated/prisma/client';

export class UpdateRoleDto {
  @IsEnum(Role)
  role!: Role;
}

export class AdjustCoinsDto {
  @IsInt()
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  note?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number' })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;
}

export class CreateFinancialAccountDto {
  @ApiPropertyOptional({ enum: FinancialAccountProvider })
  @IsEnum(FinancialAccountProvider)
  provider!: FinancialAccountProvider;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(120)
  accountNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  accountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateFinancialAccountDto {
  @ApiPropertyOptional({ enum: FinancialAccountProvider })
  @IsOptional()
  @IsEnum(FinancialAccountProvider)
  provider?: FinancialAccountProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  accountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

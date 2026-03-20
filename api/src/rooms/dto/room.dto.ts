import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { GameSpeed } from 'generated/prisma/client';

export class CreateRoomDto {
  @ApiProperty({ example: 'Friday Night Bingo' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ enum: GameSpeed, default: GameSpeed.NORMAL })
  @IsOptional()
  @IsEnum(GameSpeed)
  speed?: GameSpeed;

  @ApiPropertyOptional({ example: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  entryFee?: number;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(500)
  maxPlayers?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  cardsPerPlayer?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ example: 'secret123' })
  @ValidateIf((dto: CreateRoomDto) => dto.isPrivate === true)
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  password?: string;
}

export class JoinRoomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;
}

export class ClaimBingoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cardId?: string;
}

export class SelectRoomCardsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  cardIds!: string[];
}

export class QueryRoomsDto {
  @ApiPropertyOptional({ enum: ['waiting', 'playing', 'all'], default: 'all' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  includeCancelled?: boolean;
}

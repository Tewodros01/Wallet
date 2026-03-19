import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTournamentDto {
  @IsString() name: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() sponsored?: string;
  @IsInt() @Min(0) prize: number;
  @IsInt() @Min(0) entryFee: number;
  @IsInt() @Min(2) maxPlayers: number;
  @IsDateString() startsAt: string;
}

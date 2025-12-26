import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyArtisanDto {
  @ApiProperty({ description: 'Whether artisan is verified' })
  @IsBoolean()
  verified: boolean;

  @ApiPropertyOptional({ description: 'Verification reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}






















import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Note: snake_case properties maintained for API backwards compatibility */
export class ShareDesignDto {
  @ApiPropertyOptional({ description: 'Number of days until the share link expires', example: 30, minimum: 1, maximum: 365 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  expires_in_days?: number;

  @ApiPropertyOptional({ description: 'Optional password to protect the share link' })
  @IsOptional()
  @IsString()
  password?: string;
}

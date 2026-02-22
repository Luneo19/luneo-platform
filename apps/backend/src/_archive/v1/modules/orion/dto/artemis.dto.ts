import {
  IsString,
  IsOptional,
  IsDateString,
  IsIP,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockIPDto {
  @ApiProperty({ description: 'IP address to block' })
  @IsIP()
  ipAddress: string;

  @ApiProperty({ description: 'Reason for blocking' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Brand ID to scope the block' })
  @IsOptional()
  @IsString()
  brandId?: string;
}

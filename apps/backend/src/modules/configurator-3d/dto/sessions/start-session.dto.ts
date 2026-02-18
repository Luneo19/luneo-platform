import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ description: 'Configuration ID' })
  @IsString()
  configurationId: string;

  @ApiPropertyOptional({ description: 'Visitor ID' })
  @IsOptional()
  @IsString()
  visitorId?: string;

  @ApiPropertyOptional({ description: 'Anonymous ID' })
  @IsOptional()
  @IsString()
  anonymousId?: string;

  @ApiPropertyOptional({ description: 'Device info' })
  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, unknown>;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production Integrations Key' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['conversations:read', 'contacts:read', 'messages:write'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({ type: [String], example: ['messages:send', 'contacts:read'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ type: [String], example: ['203.0.113.42'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  allowedIps?: string[];

  @ApiPropertyOptional({ minimum: 10, maximum: 100000, default: 1000 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100000)
  rateLimit?: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;
}

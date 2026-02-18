/**
 * DTOs for AR QR Codes API
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsUrl,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QRCodeType } from '@prisma/client';

export class CreateQRCodeDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ enum: QRCodeType, description: 'QR code type' })
  @IsEnum(QRCodeType)
  type: QRCodeType;

  @ApiProperty({ description: 'Target URL (or path)' })
  @IsString()
  targetURL: string;

  @ApiProperty({ description: 'Display name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo URL for overlay' })
  @IsOptional()
  @IsString()
  logoURL?: string;

  @ApiPropertyOptional({ description: 'Foreground color hex' })
  @IsOptional()
  @IsString()
  foregroundColor?: string;

  @ApiPropertyOptional({ description: 'Background color hex' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Style: squares, dots, rounded' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ description: 'Size in pixels' })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  size?: number;

  @ApiPropertyOptional({ description: 'Error correction: L, M, Q, H' })
  @IsOptional()
  @IsString()
  errorCorrection?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Expiry date ISO string' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class UpdateQRCodeDto {
  @ApiPropertyOptional({ description: 'Target URL' })
  @IsOptional()
  @IsString()
  targetURL?: string;

  @ApiPropertyOptional({ description: 'Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  logoURL?: string;

  @ApiPropertyOptional({ description: 'Foreground color' })
  @IsOptional()
  @IsString()
  foregroundColor?: string;

  @ApiPropertyOptional({ description: 'Background color' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Style' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ description: 'Size' })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  size?: number;

  @ApiPropertyOptional({ description: 'Error correction' })
  @IsOptional()
  @IsString()
  errorCorrection?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Expires at ISO' })
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

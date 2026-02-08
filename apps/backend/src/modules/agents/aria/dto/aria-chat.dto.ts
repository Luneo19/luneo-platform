import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsUUID,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AriaCurrentStyleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  font?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;
}

export class AriaChatContextDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  occasion?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipient?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currentText?: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => AriaCurrentStyleDto)
  @IsOptional()
  currentStyle?: AriaCurrentStyleDto;

  @ApiPropertyOptional({ default: 'fr' })
  @IsString()
  @IsOptional()
  language?: string;
}

/** POST /agents/aria/chat */
export class AriaChatDto {
  @ApiProperty({ description: 'Session ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Product ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiProperty({ description: 'User message', minLength: 1, maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ description: 'Context for personalization' })
  @ValidateNested()
  @Type(() => AriaChatContextDto)
  @IsOptional()
  context?: AriaChatContextDto;
}

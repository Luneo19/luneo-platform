import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NovaChatContextDto {
  @ApiPropertyOptional({ description: 'User ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Previous messages in the session' })
  @IsArray()
  @IsOptional()
  previousMessages?: unknown[];
}

/** POST /agents/nova/chat */
export class NovaChatDto {
  @ApiProperty({ description: 'User message', minLength: 1, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ description: 'Session ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Context' })
  @ValidateNested()
  @Type(() => NovaChatContextDto)
  @IsOptional()
  context?: NovaChatContextDto;
}

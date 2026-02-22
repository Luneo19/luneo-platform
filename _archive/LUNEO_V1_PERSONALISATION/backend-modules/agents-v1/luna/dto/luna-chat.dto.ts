import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LunaDateRangeDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsString()
  @IsOptional()
  start?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsString()
  @IsOptional()
  end?: string;
}

export class LunaChatContextDto {
  @ApiPropertyOptional({ description: 'Current page in the app' })
  @IsString()
  @IsOptional()
  currentPage?: string;

  @ApiPropertyOptional({ description: 'Selected product ID (UUID)' })
  @IsString()

  @IsOptional()
  selectedProductId?: string;

  @ApiPropertyOptional({ description: 'Date range filter' })
  @ValidateNested()
  @Type(() => LunaDateRangeDto)
  @IsOptional()
  dateRange?: LunaDateRangeDto;
}

/** POST /agents/luna/chat */
export class LunaChatDto {
  @ApiProperty({ description: 'User message', minLength: 1, maxLength: 4000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ description: 'Conversation ID (UUID) for continuity' })
  @IsString()

  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Context for the conversation' })
  @ValidateNested()
  @Type(() => LunaChatContextDto)
  @IsOptional()
  context?: LunaChatContextDto;
}

import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, IsNumber, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatContextDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentPage?: string;

  @ApiPropertyOptional({ default: 'fr' })
  @IsOptional()
  @IsString()
  userLocale?: string;
}

export class ChatOptionsDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({ default: 4096 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(32000)
  maxTokens?: number;

  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;
}

export class ChatRequestDto {
  @ApiProperty({ description: 'User message', minLength: 1, maxLength: 10000 })
  @IsString()
  @Length(1, 10000)
  message: string;

  @ApiPropertyOptional({ enum: ['luna', 'aria', 'nova', 'auto'], default: 'auto' })
  @IsOptional()
  @IsEnum(['luna', 'aria', 'nova', 'auto'])
  agentType?: 'luna' | 'aria' | 'nova' | 'auto';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ type: ChatContextDto })
  @IsOptional()
  @IsObject()
  context?: ChatContextDto;

  @ApiPropertyOptional({ type: ChatOptionsDto })
  @IsOptional()
  @IsObject()
  options?: ChatOptionsDto;
}

import { IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculatePriceDto {
  @ApiProperty({
    description: 'Current selections (componentId -> optionId mapping)',
    example: { 'component-1': 'option-1', 'component-2': 'option-2' },
  })
  @IsObject()
  selections: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Session ID for context',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Currency (ISO 4217)',
    example: 'EUR',
    pattern: '^[A-Z]{3}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a valid ISO 4217 code' })
  currency?: string;
}

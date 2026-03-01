import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class BuyCreditsDto {
  @ApiPropertyOptional({
    description: 'Credit pack id (preferred, stable identifier)',
    example: 'pack_500',
  })
  @IsOptional()
  @IsString()
  packId?: string;

  @ApiPropertyOptional({
    description: 'Credit pack size (legacy fallback when packId is not provided)',
    example: 100,
    minimum: 1,
  })
  @ValidateIf((dto: BuyCreditsDto) => !dto.packId)
  @IsNumber()
  @Min(1, { message: 'Pack size must be at least 1' })
  packSize?: number;
}

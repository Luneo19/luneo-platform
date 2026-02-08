import { IsString, IsOptional, IsObject, ValidateNested, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PositionDto {
  @ApiPropertyOptional({ description: 'X position' })
  @IsOptional()
  @IsNumber()
  x?: number;

  @ApiPropertyOptional({ description: 'Y position' })
  @IsOptional()
  @IsNumber()
  y?: number;
}

export class ApplyZonePresetDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Preset ID to apply' })
  @IsString()
  @IsNotEmpty()
  presetId: string;

  @ApiPropertyOptional({ description: 'Optional position for the zone', type: PositionDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PositionDto)
  position?: { x: number; y: number };
}

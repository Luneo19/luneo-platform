import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ZoneUVDto {
  @ApiProperty({ description: 'U coordinates', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  u: number[];

  @ApiProperty({ description: 'V coordinates', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  v: number[];
}

export class GenerateCustomizationDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Zone ID' })
  @IsString()
  @IsNotEmpty()
  zoneId: string;

  @ApiProperty({ description: 'Prompt for customization generation' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ description: 'Font name' })
  @IsOptional()
  @IsString()
  font?: string;

  @ApiPropertyOptional({ description: 'Color (e.g. #hex or name)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Font size' })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({
    description: 'Text effect',
    enum: ['normal', 'embossed', 'engraved', '3d'],
  })
  @IsOptional()
  @IsEnum(['normal', 'embossed', 'engraved', '3d'])
  effect?: 'normal' | 'embossed' | 'engraved' | '3d';

  @ApiProperty({ description: 'Zone UV coordinates', type: ZoneUVDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ZoneUVDto)
  zoneUV: { u: number[]; v: number[] };

  @ApiProperty({ description: 'Model URL' })
  @IsString()
  @IsNotEmpty()
  modelUrl: string;
}

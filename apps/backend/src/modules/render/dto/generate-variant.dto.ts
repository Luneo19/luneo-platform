import { IsString, IsUrl, IsObject, IsEnum, ValidateNested, IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaterialDto {
  @ApiProperty({ description: 'Material ID' })
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @ApiProperty({ description: 'Material name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Material type', enum: ['metal', 'stone', 'finish'] })
  @IsEnum(['metal', 'stone', 'finish'])
  type: 'metal' | 'stone' | 'finish';

  @ApiPropertyOptional({ description: 'Material properties' })
  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;
}

export class GenerateVariantDto {
  @ApiProperty({ description: 'Design ID' })
  @IsString()
  @IsNotEmpty()
  designId: string;

  @ApiProperty({ description: 'Base model URL' })
  @IsUrl()
  @IsNotEmpty()
  baseModelUrl: string;

  @ApiProperty({ description: 'Material', type: MaterialDto })
  @ValidateNested()
  @Type(() => MaterialDto)
  material: MaterialDto;
}

export class GenerateVariantsBatchDto {
  @ApiProperty({ description: 'Design ID' })
  @IsString()
  @IsNotEmpty()
  designId: string;

  @ApiProperty({ description: 'Base model URL' })
  @IsUrl()
  @IsNotEmpty()
  baseModelUrl: string;

  @ApiProperty({ description: 'Materials', type: [MaterialDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  materials: MaterialDto[];
}


































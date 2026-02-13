import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomizationDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  zoneId: string;

  @ApiProperty()
  @IsString()
  prompt: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  font?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  size?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  effect?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orientation?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  options?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}

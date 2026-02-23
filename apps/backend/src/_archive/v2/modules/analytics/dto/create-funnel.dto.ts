import { IsString, IsArray, IsOptional, IsBoolean, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FunnelStepDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  eventType: string;

  @ApiProperty()
  @IsNumber()
  order: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateFunnelDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [FunnelStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunnelStepDto)
  steps: FunnelStepDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

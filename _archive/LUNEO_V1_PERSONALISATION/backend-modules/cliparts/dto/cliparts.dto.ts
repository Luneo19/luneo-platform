import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClipartDto {
  @ApiProperty({ description: 'Clipart name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Clipart URL' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Clipart category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateClipartDto {
  @ApiPropertyOptional({ description: 'Clipart name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Clipart URL' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Clipart category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIndustryDto {
  @ApiProperty({ example: 'jewelry' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Bijouterie' })
  @IsString()
  labelFr: string;

  @ApiProperty({ example: 'Jewelry' })
  @IsString()
  labelEn: string;

  @ApiProperty({ example: 'gem' })
  @IsString()
  icon: string;

  @ApiProperty({ example: '#8B5CF6' })
  @IsString()
  accentColor: string;

  @ApiPropertyOptional({ example: 'Industry for jewelry brands' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

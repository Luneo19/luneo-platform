import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class UpdateProjectDto {
  @ApiProperty({ description: 'Project name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Project description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Canvas configuration', required: false })
  @IsObject()
  @IsOptional()
  canvas?: {
    width: number;
    height: number;
    backgroundColor?: string;
    units: 'px' | 'mm' | 'in';
  };

  @ApiProperty({ description: 'Layers', required: false })
  @IsArray()
  @IsOptional()
  layers?: Record<string, unknown>[];
}



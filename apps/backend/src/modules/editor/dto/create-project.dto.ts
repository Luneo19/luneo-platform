import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', example: 'My Design' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Project description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Canvas configuration' })
  @IsObject()
  canvas: {
    width: number;
    height: number;
    backgroundColor?: string;
    units: 'px' | 'mm' | 'in';
  };

  @ApiProperty({ description: 'Initial layers', default: [] })
  @IsArray()
  @IsOptional()
  layers?: any[];
}


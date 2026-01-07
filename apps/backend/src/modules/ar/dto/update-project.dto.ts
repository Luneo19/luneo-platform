import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateProjectDto {
  @ApiProperty({ description: 'Project name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Project description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Model IDs', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modelIds?: string[];
}



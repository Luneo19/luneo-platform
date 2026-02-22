import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', example: 'Summer Collection AR' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Project description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Model IDs', example: ['model-1', 'model-2'] })
  @IsArray()
  @IsString({ each: true })
  modelIds: string[];

  @ApiProperty({ description: 'Permissions', required: false })
  @IsObject()
  @IsOptional()
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canComment: boolean;
  };
}



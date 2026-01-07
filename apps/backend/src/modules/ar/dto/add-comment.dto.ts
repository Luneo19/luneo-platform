import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({ description: 'Comment content', example: 'Great model!' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Model ID', required: false })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiProperty({ description: 'Position', required: false })
  @IsObject()
  @IsOptional()
  position?: { x: number; y: number; z: number };
}



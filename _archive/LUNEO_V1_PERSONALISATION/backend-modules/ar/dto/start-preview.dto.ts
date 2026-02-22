import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartPreviewDto {
  @ApiProperty()
  @IsString()
  modelId: string;
}

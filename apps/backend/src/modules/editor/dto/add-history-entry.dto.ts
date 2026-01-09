import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject } from 'class-validator';

export class AddHistoryEntryDto {
  @ApiProperty({ description: 'Action name', example: 'add-layer' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Action data' })
  @IsObject()
  data: Record<string, unknown>;
}



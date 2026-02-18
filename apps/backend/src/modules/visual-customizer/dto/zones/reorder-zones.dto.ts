import {
  IsArray,
  IsString,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderZonesDto {
  @ApiProperty({
    description: 'Array of zone IDs in the desired order',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '660e8400-e29b-41d4-a716-446655440001',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  zoneIds: string[];
}

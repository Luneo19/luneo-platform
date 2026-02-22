import {
  IsArray,
  IsNumber,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CONFIGURATOR_3D_LIMITS } from '../../configurator-3d.constants';

export class ReorderItemDto {
  @ApiProperty({
    description: 'Component ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  id: string;

  @ApiProperty({
    description: 'New sort order',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  sortOrder: number;
}

export class ReorderComponentsDto {
  @ApiProperty({
    description: 'Items to reorder',
    type: [ReorderItemDto],
    minItems: 1,
    maxItems: CONFIGURATOR_3D_LIMITS.MAX_REORDER_ITEMS,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(CONFIGURATOR_3D_LIMITS.MAX_REORDER_ITEMS)
  items: ReorderItemDto[];
}

import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOptionDto } from './create-option.dto';
import { CONFIGURATOR_3D_LIMITS } from '../../configurator-3d.constants';

export class BulkCreateOptionsDto {
  @ApiProperty({
    description: 'Options to create',
    type: [CreateOptionDto],
    minItems: 1,
    maxItems: CONFIGURATOR_3D_LIMITS.MAX_BULK_OPTIONS,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(CONFIGURATOR_3D_LIMITS.MAX_BULK_OPTIONS)
  options: CreateOptionDto[];
}

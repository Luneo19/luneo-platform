import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateComponentDto } from './create-component.dto';
import { CONFIGURATOR_3D_LIMITS } from '../../configurator-3d.constants';

export class BulkCreateComponentsDto {
  @ApiProperty({
    description: 'Components to create',
    type: [CreateComponentDto],
    minItems: 1,
    maxItems: CONFIGURATOR_3D_LIMITS.MAX_BULK_COMPONENTS,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateComponentDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(CONFIGURATOR_3D_LIMITS.MAX_BULK_COMPONENTS)
  components: CreateComponentDto[];
}

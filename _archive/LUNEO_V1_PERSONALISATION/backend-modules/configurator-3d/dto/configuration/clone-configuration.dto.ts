import {
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CONFIGURATOR_3D_LIMITS } from '../../configurator-3d.constants';

export class CloneConfigurationDto {
  @ApiProperty({
    description: 'Name for the cloned configuration',
    example: 'My Cloned Configurator',
    minLength: CONFIGURATOR_3D_LIMITS.MIN_NAME_LENGTH,
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH,
  })
  @IsString()
  @MinLength(CONFIGURATOR_3D_LIMITS.MIN_NAME_LENGTH)
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH)
  newName: string;

  @ApiProperty({
    description: 'Include rules in the clone',
    default: true,
  })
  @IsBoolean()
  includeRules: boolean;

  @ApiPropertyOptional({
    description: 'Include analytics data in the clone',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeAnalytics?: boolean = false;
}

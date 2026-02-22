import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CONFIGURATOR_3D_LIMITS } from '../../configurator-3d.constants';

export class SaveConfigurationDto {
  @ApiProperty({
    description: 'Saved configuration name',
    example: 'My Custom Design',
    minLength: 1,
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH)
  name: string;

  @ApiPropertyOptional({
    description: 'Description',
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_DESCRIPTION_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_DESCRIPTION_LENGTH)
  description?: string;

  @ApiPropertyOptional({
    description: 'Make configuration publicly shareable',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;
}

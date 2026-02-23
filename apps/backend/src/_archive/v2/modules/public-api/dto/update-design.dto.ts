import { IsString, IsOptional, IsObject, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDesignDto {
  @ApiPropertyOptional({ description: 'Name of the design' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the design' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Customization data for the design' })
  @IsObject()
  @IsOptional()
  customizationData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

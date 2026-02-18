import { IsObject, IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSessionDto {
  @ApiPropertyOptional({
    description: 'Current selections (componentId -> optionId mapping)',
    example: { 'component-1': 'option-1', 'component-2': 'option-2' },
  })
  @IsOptional()
  @IsObject()
  selections?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Preview image URL',
  })
  @IsOptional()
  @IsUrl()
  previewImageUrl?: string;
}

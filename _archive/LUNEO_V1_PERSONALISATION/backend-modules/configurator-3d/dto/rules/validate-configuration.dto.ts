import { IsObject, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateConfigurationDto {
  @ApiProperty({
    description: 'Current selections (componentId -> optionId mapping)',
    example: { 'component-1': 'option-1', 'component-2': 'option-2' },
  })
  @IsObject()
  selections: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Session ID for context',
  })
  @IsOptional()
  @IsUUID('4')
  sessionId?: string;
}

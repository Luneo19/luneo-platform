import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComponentType, SelectionMode } from './create-component.dto';

export class ComponentResponseDto {
  @ApiProperty({ description: 'Component ID' })
  id: string;

  @ApiProperty({ description: 'Configuration ID' })
  configurationId: string;

  @ApiProperty({ description: 'Component name' })
  name: string;

  @ApiPropertyOptional({ description: 'Technical ID' })
  technicalId?: string | null;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string | null;

  @ApiProperty({ description: 'Component type', enum: ComponentType })
  type: string;

  @ApiPropertyOptional({ description: 'Mesh name' })
  meshName?: string | null;

  @ApiProperty({ description: 'Selection mode', enum: SelectionMode })
  selectionMode: SelectionMode;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Is visible' })
  isVisible: boolean;

  @ApiProperty({ description: 'Is enabled' })
  isEnabled: boolean;

  @ApiPropertyOptional({ description: 'Icon URL' })
  iconUrl?: string | null;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  previewImageUrl?: string | null;

  @ApiPropertyOptional({ description: '3D bounds' })
  bounds?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Camera focus point' })
  cameraFocusPoint?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Dependencies' })
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

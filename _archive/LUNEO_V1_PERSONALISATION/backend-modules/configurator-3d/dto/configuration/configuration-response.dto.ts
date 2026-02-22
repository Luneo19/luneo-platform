import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfiguratorType, ConfiguratorStatus } from '@prisma/client';

export class ConfigurationResponseDto {
  @ApiProperty({ description: 'Configuration ID' })
  id: string;

  @ApiProperty({ description: 'Configuration name' })
  name: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  description?: string | null;

  @ApiProperty({ description: 'Unique slug' })
  slug: string;

  @ApiProperty({ description: 'Configurator type', enum: ConfiguratorType })
  type: ConfiguratorType;

  @ApiProperty({ description: 'Configurator status', enum: ConfiguratorStatus })
  status: ConfiguratorStatus;

  @ApiPropertyOptional({ description: 'Associated product ID' })
  productId?: string | null;

  @ApiPropertyOptional({ description: '3D model URL' })
  modelUrl?: string | null;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ description: 'Scene settings' })
  sceneSettings?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Camera settings' })
  cameraSettings?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Pricing settings' })
  pricingSettings?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Enable AR' })
  enableAR: boolean;

  @ApiProperty({ description: 'Enable screenshots' })
  enableScreenshots: boolean;

  @ApiProperty({ description: 'Enable sharing' })
  enableSharing: boolean;

  @ApiPropertyOptional({ description: 'Tags' })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Version' })
  version: number;

  @ApiProperty({ description: 'View count' })
  viewCount: number;

  @ApiProperty({ description: 'Session count' })
  sessionCount: number;

  @ApiProperty({ description: 'Conversion count' })
  conversionCount: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Published at' })
  publishedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Archived at' })
  archivedAt?: Date | null;
}

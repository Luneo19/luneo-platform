import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Configurator3DSessionStatus, ConversionType } from '@prisma/client';

export class SessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Client session ID' })
  sessionId?: string | null;

  @ApiProperty({ description: 'Configuration ID' })
  configurationId: string;

  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string | null;

  @ApiPropertyOptional({ description: 'Visitor ID' })
  visitorId?: string | null;

  @ApiPropertyOptional({ description: 'Anonymous ID' })
  anonymousId?: string | null;

  @ApiProperty({ description: 'Session status', enum: Configurator3DSessionStatus })
  status: Configurator3DSessionStatus;

  @ApiPropertyOptional({ description: 'Current selections' })
  selections?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  previewImageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Calculated price' })
  calculatedPrice?: number | null;

  @ApiPropertyOptional({ description: 'Price breakdown' })
  priceBreakdown?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiPropertyOptional({ description: 'Source' })
  source?: string | null;

  @ApiPropertyOptional({ description: 'Referrer' })
  referrer?: string | null;

  @ApiPropertyOptional({ description: 'UTM params' })
  utmParams?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Started at' })
  startedAt: Date;

  @ApiProperty({ description: 'Last activity at' })
  lastActivityAt: Date;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Saved at' })
  savedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Completed at' })
  completedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Expires at' })
  expiresAt?: Date | null;

  @ApiPropertyOptional({ description: 'Converted at' })
  convertedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Conversion type', enum: ConversionType })
  conversionType?: ConversionType | null;

  @ApiPropertyOptional({ description: 'Conversion value' })
  conversionValue?: number | null;

  @ApiPropertyOptional({ description: 'Order ID' })
  orderId?: string | null;
}

export class SessionSummaryDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Configuration ID' })
  configurationId: string;

  @ApiProperty({ description: 'Status', enum: Configurator3DSessionStatus })
  status: Configurator3DSessionStatus;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  previewImageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Calculated price' })
  calculatedPrice?: number | null;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Started at' })
  startedAt: Date;

  @ApiProperty({ description: 'Last activity at' })
  lastActivityAt: Date;
}

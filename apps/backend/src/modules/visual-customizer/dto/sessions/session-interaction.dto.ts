import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionInteractionDto {
  @ApiProperty({
    description: 'Interaction type',
    example: 'LAYER_CREATE',
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Zone ID (for zone-related interactions)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiPropertyOptional({
    description: 'Layer ID (for layer-related interactions)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  layerId?: string;

  @ApiPropertyOptional({
    description: 'Tool used',
    example: 'text',
  })
  @IsOptional()
  @IsString()
  toolUsed?: string;

  @ApiPropertyOptional({
    description: 'Additional interaction data',
    example: {
      action: 'create',
      properties: {},
    },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Duration in milliseconds',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMs?: number;
}

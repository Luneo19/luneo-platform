import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InteractionType } from '@prisma/client';

export class SessionInteractionDto {
  @ApiProperty({
    description: 'Interaction type',
    enum: InteractionType,
  })
  @IsEnum(InteractionType)
  type: InteractionType;

  @ApiPropertyOptional({
    description: 'Component ID (for component-related interactions)',
  })
  @IsOptional()
  @IsUUID('4')
  componentId?: string;

  @ApiPropertyOptional({
    description: 'Option ID (for option-related interactions)',
  })
  @IsOptional()
  @IsUUID('4')
  optionId?: string;

  @ApiPropertyOptional({
    description: 'Previous option ID (for option change)',
  })
  @IsOptional()
  @IsUUID('4')
  previousOptionId?: string;

  @ApiPropertyOptional({
    description: 'Camera position at time of interaction',
  })
  @IsOptional()
  @IsObject()
  cameraPosition?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Duration in milliseconds',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMs?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

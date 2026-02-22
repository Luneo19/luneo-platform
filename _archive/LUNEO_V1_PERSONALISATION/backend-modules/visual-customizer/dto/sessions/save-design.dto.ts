import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators/sanitize.decorator';

export class SaveDesignDto {
  @ApiProperty({
    description: 'Design name',
    example: 'My Custom Design',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Sanitize()
  name: string;

  @ApiPropertyOptional({
    description: 'Design description',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Canvas data (JSON object containing layers, zones, etc.)',
    example: {
      layers: [],
      zones: [],
      settings: {},
    },
  })
  @IsObject()
  @IsNotEmpty()
  canvasData: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Thumbnail data URL (base64 encoded image)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
  })
  @IsOptional()
  @IsString()
  thumbnailDataUrl?: string;

  @ApiPropertyOptional({
    description: 'Is public design',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Allow remix',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowRemix?: boolean;
}

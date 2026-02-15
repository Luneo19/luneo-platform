import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalibrationDataDto {
  @ApiProperty({
    description: 'Empreinte unique du device',
    example: 'fp_abc123xyz',
  })
  @IsString()
  deviceFingerprint: string;

  @ApiProperty({
    description: 'Type de device',
    enum: ['mobile', 'desktop', 'tablet'],
    example: 'mobile',
  })
  @IsEnum(['mobile', 'desktop', 'tablet'] as const)
  deviceType: 'mobile' | 'desktop' | 'tablet';

  @ApiProperty({
    description: 'Résolution de la caméra',
    example: '1280x720',
  })
  @IsString()
  cameraResolution: string;

  @ApiProperty({
    description: 'Distance moyenne caméra-sujet en cm',
    example: 45.0,
  })
  @IsNumber()
  @Min(10)
  @Max(200)
  averageDistance: number;

  @ApiProperty({
    description: 'Ratio pixels par mm réel',
    example: 3.5,
  })
  @IsNumber()
  @Min(0.01)
  pixelToRealRatio: number;

  @ApiProperty({
    description: 'Score de précision (0 = mauvais, 1 = parfait)',
    example: 0.85,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  accuracyScore: number;

  @ApiPropertyOptional({
    description: 'Taille de main normalisée depuis MediaPipe',
    example: 0.25,
  })
  @IsOptional()
  @IsNumber()
  handSizeNormalized?: number;

  @ApiPropertyOptional({
    description: 'Largeur de visage normalisée depuis MediaPipe',
    example: 0.35,
  })
  @IsOptional()
  @IsNumber()
  faceWidthNormalized?: number;
}

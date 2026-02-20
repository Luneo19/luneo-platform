import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const AR_FORMAT = ['usdz', 'gltf'] as const;
export type ARFormat = (typeof AR_FORMAT)[number];

export const AR_QUALITY = ['low', 'medium', 'high'] as const;
export type ARQuality = (typeof AR_QUALITY)[number];

export class ExportARDto {
  @ApiPropertyOptional({
    description: 'Export format',
    enum: AR_FORMAT,
    default: 'usdz',
  })
  @IsOptional()
  @IsIn(AR_FORMAT)
  format?: ARFormat = 'usdz';

  @ApiPropertyOptional({
    description: 'Quality level',
    enum: AR_QUALITY,
    default: 'medium',
  })
  @IsOptional()
  @IsIn(AR_QUALITY)
  quality?: ARQuality = 'medium';

  @ApiPropertyOptional({
    description: 'Optimize for mobile devices',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  optimizeForMobile?: boolean = true;
}

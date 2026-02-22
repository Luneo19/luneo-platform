import { PartialType } from '@nestjs/swagger';
import { ExportImageDto } from './export-image.dto';
import {
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const COLOR_PROFILE = ['sRGB', 'CMYK', 'AdobeRGB'] as const;
export type ColorProfile = (typeof COLOR_PROFILE)[number];

export const PDF_COMPLIANCE = ['PDF/A-1b', 'PDF/X-1a', 'PDF/X-3'] as const;
export type PdfCompliance = (typeof PDF_COMPLIANCE)[number];

export class ExportPrintDto extends PartialType(ExportImageDto) {
  @ApiPropertyOptional({
    description: 'Include bleed area',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeBleed?: boolean;

  @ApiPropertyOptional({
    description: 'Include crop marks',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeCropMarks?: boolean;

  @ApiPropertyOptional({
    description: 'Color profile',
    enum: COLOR_PROFILE,
    example: 'sRGB',
  })
  @IsOptional()
  @IsIn(COLOR_PROFILE)
  colorProfile?: ColorProfile;

  @ApiPropertyOptional({
    description: 'Flatten layers',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  flattenLayers?: boolean;

  @ApiPropertyOptional({
    description: 'Export as PDF',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  asPDF?: boolean;

  @ApiPropertyOptional({
    description: 'PDF compliance standard',
    enum: PDF_COMPLIANCE,
    example: 'PDF/A-1b',
  })
  @IsOptional()
  @IsIn(PDF_COMPLIANCE)
  pdfCompliance?: PdfCompliance;
}

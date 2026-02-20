import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportPDFDto {
  @ApiPropertyOptional({
    description: 'Include product specifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeSpecs?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include price in PDF',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includePrice?: boolean = true;

  @ApiPropertyOptional({
    description: 'Custom logo URL',
  })
  @IsOptional()
  @IsUrl()
  customLogo?: string;

  @ApiPropertyOptional({
    description: 'Language code',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Template name',
  })
  @IsOptional()
  @IsString()
  template?: string;
}

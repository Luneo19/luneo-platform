import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  IsUrl,
} from 'class-validator';

/**
 * DTO for creating a custom theme
 * Matches CreateThemeData interface
 */
export class CreateThemeDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand_123',
  })
  @IsString()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({
    description: 'Theme name',
    example: 'Corporate Blue',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Primary color (hex format)',
    example: '#FF5733',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Primary color must be a valid hex color (e.g., #FF5733)',
  })
  primaryColor: string;

  @ApiProperty({
    description: 'Secondary color (hex format)',
    example: '#33FF57',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Secondary color must be a valid hex color (e.g., #33FF57)',
  })
  secondaryColor: string;

  @ApiProperty({
    description: 'Accent color (hex format)',
    example: '#3357FF',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Accent color must be a valid hex color (e.g., #3357FF)',
  })
  accentColor: string;

  @ApiProperty({
    description: 'Background color (hex format)',
    example: '#FFFFFF',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Background color must be a valid hex color (e.g., #FFFFFF)',
  })
  backgroundColor: string;

  @ApiProperty({
    description: 'Text color (hex format)',
    example: '#000000',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Text color must be a valid hex color (e.g., #000000)',
  })
  textColor: string;

  @ApiPropertyOptional({
    description: 'Font family',
    example: 'Inter, sans-serif',
  })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({
    description: 'Border radius',
    example: '8px',
  })
  @IsOptional()
  @IsString()
  borderRadius?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Favicon URL',
    example: 'https://example.com/favicon.ico',
  })
  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @ApiPropertyOptional({
    description: 'Custom CSS',
    example: '.custom-class { color: red; }',
  })
  @IsOptional()
  @IsString()
  customCss?: string;
}

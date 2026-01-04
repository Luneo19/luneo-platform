import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AutoFitType {
  TEXT = 'text',
  IMAGE = 'image',
  PATTERN = 'pattern',
}

export class AutoFitDto {
  @ApiProperty({ description: 'Type of element to auto-fit', enum: AutoFitType })
  @IsEnum(AutoFitType)
  @IsNotEmpty()
  type: AutoFitType;

  @ApiProperty({ description: 'Maximum width', required: false, default: 100 })
  @IsNumber()
  @IsOptional()
  maxWidth?: number;

  @ApiProperty({ description: 'Maximum height', required: false, default: 100 })
  @IsNumber()
  @IsOptional()
  maxHeight?: number;

  // For text
  @ApiProperty({ description: 'Text content (for type=text)', required: false })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ description: 'Font family (for type=text)', required: false, default: 'Arial' })
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiProperty({ description: 'Minimum font size (for type=text)', required: false, default: 8 })
  @IsNumber()
  @IsOptional()
  minFontSize?: number;

  @ApiProperty({ description: 'Maximum font size (for type=text)', required: false, default: 72 })
  @IsNumber()
  @IsOptional()
  maxFontSize?: number;

  // For image/pattern
  @ApiProperty({ description: 'Element width (for type=image|pattern)', required: false })
  @IsNumber()
  @IsOptional()
  elementWidth?: number;

  @ApiProperty({ description: 'Element height (for type=image|pattern)', required: false })
  @IsNumber()
  @IsOptional()
  elementHeight?: number;

  @ApiProperty({ description: 'Maintain aspect ratio (for type=image|pattern)', required: false, default: true })
  @IsOptional()
  maintainAspectRatio?: boolean;
}








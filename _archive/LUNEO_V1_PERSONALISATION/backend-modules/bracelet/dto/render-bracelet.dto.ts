import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RenderBraceletDto {
  @ApiProperty({ description: 'Text to render on the bracelet' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'Font name' })
  @IsString()
  @IsNotEmpty()
  font: string;

  @ApiProperty({ description: 'Font size' })
  @IsNumber()
  @Min(1)
  @Max(500)
  fontSize: number;

  @ApiProperty({ description: 'Text alignment' })
  @IsString()
  @IsNotEmpty()
  alignment: string;

  @ApiProperty({ description: 'Text position' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({ description: 'Color (e.g. #hex or name)' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ description: 'Material name' })
  @IsString()
  @IsNotEmpty()
  material: string;

  @ApiPropertyOptional({ description: 'Output width', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: 'Output height', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({
    description: 'Output format',
    enum: ['png', 'jpg'],
  })
  @IsOptional()
  @IsEnum(['png', 'jpg'])
  format?: 'png' | 'jpg';
}

import { IsString, IsOptional, IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpscaleImageDto {
  @ApiProperty({ description: 'URL of the image to upscale' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Upscale scale factor',
    enum: ['2', '4'],
  })
  @IsOptional()
  @IsEnum(['2', '4'])
  scale?: '2' | '4';

  @ApiPropertyOptional({ description: 'Whether to enhance details' })
  @IsOptional()
  @IsBoolean()
  enhanceDetails?: boolean;
}

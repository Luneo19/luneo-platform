import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RemoveBackgroundDto {
  @ApiProperty({ description: 'URL of the image for background removal' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Detection mode for background removal',
    enum: ['auto', 'person', 'product', 'animal'],
  })
  @IsOptional()
  @IsEnum(['auto', 'person', 'product', 'animal'])
  mode?: 'auto' | 'person' | 'product' | 'animal';
}

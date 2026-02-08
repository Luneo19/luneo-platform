import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** Note: snake_case properties maintained for API backwards compatibility */
export class ConvertToArDto {
  @ApiProperty({ description: 'Design ID', example: 'clx123abc' })
  @IsString()
  design_id: string;

  @ApiProperty({ description: 'Image URL to convert to 3D', example: 'https://example.com/design.png' })
  @IsString()
  image_url: string;
}

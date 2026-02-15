import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShareDto {
  @ApiProperty({ description: 'Try-on session external ID' })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Screenshot ID to share (optional)' })
  @IsOptional()
  @IsString()
  screenshotId?: string;

  @ApiPropertyOptional({ description: 'Product ID (optional)' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({
    description: 'Target social platform',
    enum: ['instagram', 'tiktok', 'whatsapp', 'twitter', 'facebook', 'link'],
  })
  @IsIn(['instagram', 'tiktok', 'whatsapp', 'twitter', 'facebook', 'link'])
  platform: string;
}

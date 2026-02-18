import {
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({
    description: 'Customizer ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  customizerId: string;

  @ApiPropertyOptional({
    description: 'Source of the session',
    example: 'website',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Referrer URL',
    example: 'https://example.com/page',
  })
  @IsOptional()
  @IsString()
  referrer?: string;
}

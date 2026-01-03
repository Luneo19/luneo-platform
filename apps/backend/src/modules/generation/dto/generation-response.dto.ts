import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerationResponseDto {
  @ApiProperty({
    description: 'Public ID of the generation (for public access)',
    example: 'gen_abc123xyz',
  })
  id: string;

  @ApiProperty({
    description: 'Status of the generation',
    example: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Estimated time in seconds',
    example: 30,
  })
  estimatedTime?: number;

  @ApiPropertyOptional({
    description: 'URL to check generation status',
    example: '/api/v1/generation/gen_abc123xyz/status',
  })
  statusUrl?: string;

  @ApiPropertyOptional({
    description: 'Result when completed',
  })
  result?: {
    imageUrl: string;
    thumbnailUrl?: string;
    arModelUrl?: string;
    processingTime?: number;
  };

  @ApiPropertyOptional({
    description: 'Error message if failed',
  })
  error?: string;
}


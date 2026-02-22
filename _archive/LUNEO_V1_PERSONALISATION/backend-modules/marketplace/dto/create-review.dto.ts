import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

/**
 * DTO for creating or updating a template review
 * Matches CreateReviewData interface
 */
export class CreateReviewDto {
  @ApiProperty({
    description: 'Rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Review comment',
    example: 'Great template! Very easy to use.',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Purchase ID (if reviewing after purchase)',
    example: 'purchase_123',
  })
  @IsOptional()
  @IsString()
  purchaseId?: string;
}

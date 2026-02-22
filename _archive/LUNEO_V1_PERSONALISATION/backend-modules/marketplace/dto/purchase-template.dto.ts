import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * DTO for purchasing a marketplace template
 * Matches PurchaseTemplateData interface
 */
export class PurchaseTemplateDto {
  @ApiProperty({
    description: 'Buyer ID',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty({
    description: 'Price in cents',
    example: 999,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  priceCents: number;

  @ApiPropertyOptional({
    description: 'Stripe Payment Intent ID',
    example: 'pi_1234567890',
  })
  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;
}

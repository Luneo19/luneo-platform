import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

/**
 * DTO for creating a Stripe Connect account for a seller
 */
export class CreateSellerConnectDto {
  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Business type',
    enum: ['individual', 'company'],
    example: 'company',
  })
  @IsOptional()
  @IsEnum(['individual', 'company'])
  businessType?: 'individual' | 'company';

  @ApiPropertyOptional({
    description: 'Business name',
    example: 'Acme Corp',
  })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({
    description: 'First name (for individual accounts)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name (for individual accounts)',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

/**
 * DTO for creating a custom domain
 * Matches CreateCustomDomainData interface
 */
export class CreateCustomDomainDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand_123',
  })
  @IsString()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({
    description: 'Domain name',
    example: 'app.example.com',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, {
    message: 'Domain must be a valid domain name (e.g., app.example.com)',
  })
  domain: string;

  @ApiPropertyOptional({
    description: 'SSL certificate (PEM format)',
    example: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
  })
  @IsOptional()
  @IsString()
  sslCertificate?: string;
}

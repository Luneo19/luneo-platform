import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  IsUrl,
} from 'class-validator';

/**
 * DTO for creating a SAML configuration
 * Matches SAMLConfigData interface
 */
export class CreateSAMLConfigDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand_123',
  })
  @IsString()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({
    description: 'Configuration name',
    example: 'Corporate SSO',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'SAML entry point URL',
    example: 'https://sso.example.com/saml/sso',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  samlEntryPoint: string;

  @ApiProperty({
    description: 'SAML issuer',
    example: 'https://sso.example.com',
  })
  @IsString()
  @IsNotEmpty()
  samlIssuer: string;

  @ApiProperty({
    description: 'SAML certificate (PEM format)',
    example: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
  })
  @IsString()
  @IsNotEmpty()
  samlCert: string;

  @ApiProperty({
    description: 'SAML callback URL',
    example: 'https://app.example.com/auth/saml/callback',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  samlCallbackUrl: string;

  @ApiPropertyOptional({
    description: 'SAML decryption private key (PEM format)',
    example: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
  })
  @IsOptional()
  @IsString()
  samlDecryptionPvk?: string;

  @ApiPropertyOptional({
    description: 'SAML metadata URL',
    example: 'https://sso.example.com/saml/metadata',
  })
  @IsOptional()
  @IsUrl()
  metadataUrl?: string;

  @ApiPropertyOptional({
    description: 'SAML metadata XML',
    example: '<?xml version="1.0"?>...',
  })
  @IsOptional()
  @IsString()
  metadataXml?: string;

  @ApiPropertyOptional({
    description: 'Enable auto-provisioning',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoProvisioning?: boolean;

  @ApiPropertyOptional({
    description: 'Default role for auto-provisioned users',
    example: 'USER',
  })
  @IsOptional()
  @IsString()
  defaultRole?: string;

  @ApiPropertyOptional({
    description: 'Attribute mapping (SAML attribute -> user field)',
    example: { 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'email' },
  })
  @IsOptional()
  @IsObject()
  attributeMapping?: Record<string, string>;
}

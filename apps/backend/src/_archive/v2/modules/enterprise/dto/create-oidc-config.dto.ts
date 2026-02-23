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
 * DTO for creating an OIDC configuration
 * Matches OIDCConfigData interface
 */
export class CreateOIDCConfigDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand_123',
  })
  @IsString()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({
    description: 'Configuration name',
    example: 'Corporate OIDC',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'OIDC issuer URL',
    example: 'https://sso.example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  oidcIssuer: string;

  @ApiProperty({
    description: 'OIDC client ID',
    example: 'client_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  oidcClientId: string;

  @ApiProperty({
    description: 'OIDC client secret',
    example: 'secret_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  oidcClientSecret: string;

  @ApiProperty({
    description: 'OIDC callback URL',
    example: 'https://app.example.com/auth/oidc/callback',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  oidcCallbackUrl: string;

  @ApiPropertyOptional({
    description: 'OIDC scope',
    example: 'openid profile email',
    default: 'openid profile email',
  })
  @IsOptional()
  @IsString()
  oidcScope?: string;

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
    description: 'Attribute mapping (OIDC claim -> user field)',
    example: { email: 'email', name: 'displayName' },
  })
  @IsOptional()
  @IsObject()
  attributeMapping?: Record<string, string>;
}

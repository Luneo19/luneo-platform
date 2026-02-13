import { IsEmail, IsString, IsOptional, IsStrongPassword, IsIn, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

/**
 * SECURITY FIX: Only CONSUMER and BRAND_USER are allowed for self-registration.
 * BRAND_ADMIN, PLATFORM_ADMIN, and FABRICATOR must be assigned by an admin.
 */
const ALLOWED_SIGNUP_ROLES = [UserRole.CONSUMER, UserRole.BRAND_USER] as const;

export class SignupDto {
  @ApiProperty({ description: 'Email de l\'utilisateur', example: 'user@example.com' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({ description: 'Mot de passe', minLength: 8, example: 'SecurePass123!' })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  // SECURITY FIX: Enforce strong password complexity (MED-003)
  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }, { message: 'Password must be at least 8 characters with one uppercase, one lowercase, one number and one symbol' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password!: string;

  @ApiProperty({ description: 'Prénom', example: 'John' })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName!: string;

  @ApiProperty({ description: 'Nom de famille', example: 'Doe' })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName!: string;

  @ApiPropertyOptional({ description: 'Nom de l\'entreprise', example: 'Acme Corp' })
  @IsOptional()
  @IsString({ message: 'Company must be a string' })
  @MaxLength(100, { message: 'Company name must not exceed 100 characters' })
  company?: string;

  @ApiPropertyOptional({ description: 'Rôle utilisateur (CONSUMER ou BRAND_USER uniquement)', enum: ALLOWED_SIGNUP_ROLES })
  @IsOptional()
  @IsIn(ALLOWED_SIGNUP_ROLES, { message: 'Role must be CONSUMER or BRAND_USER for self-registration' })
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Token CAPTCHA pour vérification', example: '03AGdBq...' })
  @IsOptional()
  @IsString()
  captchaToken?: string;

  @ApiPropertyOptional({ description: 'Code de parrainage', example: 'REF-ABC12345' })
  @IsOptional()
  @IsString({ message: 'Referral code must be a string' })
  @MaxLength(50, { message: 'Referral code must not exceed 50 characters' })
  referralCode?: string;
}
